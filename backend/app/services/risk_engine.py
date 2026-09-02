"""
Deterministic Risk Engine with ML Hazard Intelligence Integration.
Computes auditable multi-hazard risk aggregation, explainable prioritization, and regional statistics.
"""

import math
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.village import Village
from app.models.facility import Facility, CandidateSite
from app.ml import get_landslide_probability, get_relocation_demand, get_movement_type

logger = logging.getLogger("pixelalchemy.risk")

HAZARD_WEIGHTS = {
    "hazard_zone": 0.5,
    "historical_incidents": 0.5,
}

AHP_WEIGHTS = {
    "hazard_zone": 0.30,
    "land_availability": 0.25,
    "distance_to_road_km": 0.15,
    "distance_to_water_km": 0.15,
    "distance_to_healthcare_km": 0.15,
}

HAZARD_VALUE = {
    "High": 1.0,
    "Moderate": 0.55,
    "Yellow": 0.25,
    "Green": 0.05,
}

ML_BLEND_WEIGHT = 0.30  # 30% ML Hazard Intelligence, 70% Deterministic Base


def zone_for_score(score: float) -> str:
    """Map continuous hazard score to zone color classification."""
    if score >= 0.70:
        return "Red"
    if score >= 0.45:
        return "Orange"
    if score >= 0.20:
        return "Yellow"
    return "Green"


def min_max(value: float, values: List[float]) -> float:
    """Safely min-max normalize a value across a list of values."""
    if not values:
        return 1.0
    min_val = min(values)
    max_val = max(values)
    if max_val == min_val:
        return 1.0
    return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between coordinates in km."""
    earth_radius = 6371.0
    lat_delta = math.radians(lat2 - lat1)
    lon_delta = math.radians(lon2 - lon1)
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    a = (math.sin(lat_delta / 2) ** 2 +
         math.sin(lon_delta / 2) ** 2 * math.cos(lat1_rad) * math.cos(lat2_rad))
    return earth_radius * 2 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))


def get_deterministic_base_hazard(village: Village) -> float:
    """Calculate the auditable deterministic base hazard score."""
    return round(
        HAZARD_VALUE.get(village.existing_hazard_zone, 0.55) * HAZARD_WEIGHTS["hazard_zone"] +
        min(village.historical_incidents, 1) * HAZARD_WEIGHTS["historical_incidents"],
        3
    )


def get_hazard_score(village: Village, facilities: Optional[List[Dict[str, Any]]] = None) -> float:
    """
    Compute Multi-Hazard Risk Aggregation score combining:
    1. Auditable deterministic baseline (existing zone + historical incidents) -> 70%
    2. Calibrated ML Landslide Probability -> 30%
    """
    base_hazard = get_deterministic_base_hazard(village)
    
    v_dict = {
        "lat": village.lat,
        "lon": village.lon,
        "population": village.population,
        "households": village.households,
        "existing_hazard_zone": village.existing_hazard_zone,
        "historical_incidents": village.historical_incidents,
    }
    
    try:
        ml_prob = get_landslide_probability(v_dict, facilities)
        blended = (1.0 - ML_BLEND_WEIGHT) * base_hazard + ML_BLEND_WEIGHT * ml_prob
        return round(float(blended), 3)
    except Exception as e:
        logger.warning(f"Error blending ML score for village {village.village_id}: {e}")
        return round(float(base_hazard), 3)


def get_priority_bucket(score: float) -> str:
    """Map continuous relocation priority score into operational buckets."""
    if score >= 0.62:
        return "Immediate"
    if score >= 0.42:
        return "Short-term"
    if score >= 0.22:
        return "Medium-term"
    return "Monitor"


def build_why_priority_reasons(
    existing_zone: str,
    incidents: int,
    landslide_prob: float,
    awaiting_fams: int,
    movement_type: Optional[str]
) -> List[str]:
    """Generate concise, auditable bullet points supported by real data."""
    reasons = []
    if existing_zone in ("High", "Moderate"):
        reasons.append(f"{existing_zone} baseline hazard classification in district register")
    if incidents > 0:
        reasons.append(f"{incidents} recorded historical disaster incident(s)")
    if landslide_prob >= 0.70:
        reasons.append(f"ML predicts elevated landslide susceptibility ({landslide_prob * 100:.1f}%)")
    else:
        reasons.append(f"ML landslide probability evaluated at {landslide_prob * 100:.1f}%")
    if awaiting_fams > 0:
        reasons.append(f"ML estimates approximately {awaiting_fams} families requiring relocation")
    if movement_type:
        reasons.append(f"ML classifies movement pattern as {movement_type}")
    return reasons


def add_village_scores(
    villages: List[Village],
    facilities: Optional[List[Dict[str, Any]]] = None,
    all_context_villages: Optional[List[Village]] = None
) -> List[dict]:
    """Score all villages with deterministic multi-hazard aggregation and priority ranking."""
    if not villages:
        return []
        
    context = all_context_villages if all_context_villages else villages
    populations = [v.population for v in context] or [1]
    households = [v.households for v in context] or [1]
    incidents = [v.historical_incidents for v in context] or [0]

    results = []
    for village in villages:
        v_dict = {
            "lat": village.lat,
            "lon": village.lon,
            "population": village.population,
            "households": village.households,
            "existing_hazard_zone": village.existing_hazard_zone,
            "historical_incidents": village.historical_incidents,
        }
        
        # ML Predictions
        ml_score = get_landslide_probability(v_dict, facilities)
        awaiting_fams = get_relocation_demand(v_dict, facilities)
        movement_type = get_movement_type(v_dict, facilities)
        
        deterministic_hazard = get_deterministic_base_hazard(village)
        hazard_score = get_hazard_score(village, facilities)
        
        pop_norm = min_max(village.population, populations)
        hh_norm = min_max(village.households, households)
        inc_norm = min_max(village.historical_incidents, incidents)
        
        priority_score = round(
            hazard_score * 0.40 +
            pop_norm * 0.30 +
            hh_norm * 0.10 +
            inc_norm * 0.20,
            3
        )
        
        reasons = build_why_priority_reasons(
            village.existing_hazard_zone,
            village.historical_incidents,
            ml_score,
            awaiting_fams,
            movement_type
        )

        results.append({
            "village_id": village.village_id,
            "village_name": village.village_name,
            "lat": village.lat,
            "lon": village.lon,
            "population": village.population,
            "households": village.households,
            "existing_hazard_zone": village.existing_hazard_zone,
            "historical_incidents": village.historical_incidents,
            "deterministic_hazard_score": deterministic_hazard,
            "hazard_score": hazard_score,
            "zone_color": zone_for_score(hazard_score),
            "priority_score": priority_score,
            "priority_bucket": get_priority_bucket(priority_score),
            "landslide_ml_score": ml_score,
            "landslide_probability": ml_score,
            "awaiting_families_estimate": awaiting_fams,
            "predicted_movement_type": movement_type,
            "ml_fusion_formula": "70% Deterministic + 30% ML",
            "why_priority_reasons": reasons,
        })
    return results


def get_village_detail(db: Session, village_id: str) -> Optional[dict]:
    """Retrieve comprehensive village profile with nearby infrastructure."""
    village = db.query(Village).filter(Village.village_id == village_id).first()
    if not village:
        return None

    facilities_rows = db.query(Facility).all()
    facility_dicts = [{
        "facility_id": f.facility_id,
        "name": f.name,
        "type": f.type,
        "lat": f.lat,
        "lon": f.lon,
    } for f in facilities_rows]

    all_villages = db.query(Village).all()
    scored = add_village_scores([village], facility_dicts, all_context_villages=all_villages)[0]

    nearby = []
    for f in facilities_rows:
        distance = haversine_km(village.lat, village.lon, f.lat, f.lon)
        if distance <= 35.0:
            nearby.append({
                "facility_id": f.facility_id,
                "name": f.name,
                "type": f.type,
                "lat": f.lat,
                "lon": f.lon,
                "distance_km": round(distance, 2)
            })
    nearby.sort(key=lambda x: x["distance_km"])
    scored["nearby_facilities"] = nearby[:8]
    return scored


def get_zone_markers(db: Session) -> List[dict]:
    """Generate map markers for risk heatmap including ML hazard intelligence."""
    villages = db.query(Village).order_by(Village.village_id).all()
    scored = add_village_scores(villages)
    return [{
        "village_id": v["village_id"],
        "village_name": v["village_name"],
        "lat": v["lat"],
        "lon": v["lon"],
        "zone_color": v["zone_color"],
        "hazard_score": v["hazard_score"],
        "population": v["population"],
        "households": v["households"],
        "historical_incidents": v["historical_incidents"],
        "deterministic_hazard_score": v["deterministic_hazard_score"],
        "landslide_ml_score": v["landslide_ml_score"],
        "landslide_probability": v["landslide_probability"],
        "predicted_movement_type": v["predicted_movement_type"],
        "awaiting_families_estimate": v["awaiting_families_estimate"],
        "priority_score": v["priority_score"],
        "priority_bucket": v["priority_bucket"],
    } for v in scored]


def get_priority_villages(db: Session) -> List[dict]:
    """Rank villages by relocation urgency with auditable contribution breakdown."""
    villages = db.query(Village).order_by(Village.village_id).all()
    scored = add_village_scores(villages)
    scored.sort(key=lambda x: x["priority_score"], reverse=True)
    
    max_pop = max((v["population"] for v in scored), default=1) or 1
    max_hh = max((v["households"] for v in scored), default=1) or 1
    
    for v in scored:
        v["score_breakdown"] = {
            "hazard_exposure": round(v["hazard_score"] * 0.40, 3),
            "population_pressure": round((v["population"] / max_pop) * 0.30, 3),
            "household_exposure": round((v["households"] / max_hh) * 0.10, 3),
            "historical_incidents": round(min(v["historical_incidents"], 1) * 0.20, 3),
        }
    return scored


def get_dashboard_summary(db: Session) -> dict:
    """Calculate aggregate regional disaster exposure metrics and ML KPI summaries."""
    villages = db.query(Village).all()
    scored = add_village_scores(villages)
    
    zone_counts = {"Red": 0, "Orange": 0, "Yellow": 0, "Green": 0}
    priority_counts = {"Immediate": 0, "Short-term": 0, "Medium-term": 0, "Monitor": 0}
    
    for v in scored:
        z = v["zone_color"]
        p = v["priority_bucket"]
        zone_counts[z] = zone_counts.get(z, 0) + 1
        priority_counts[p] = priority_counts.get(p, 0) + 1
    
    high_risk = [v for v in scored if v["zone_color"] in ("Red", "Orange")]
    total_count = len(scored) or 1
    
    avg_ml_prob = round(sum(v["landslide_probability"] for v in scored) / total_count, 3)
    total_demand = sum(v["awaiting_families_estimate"] for v in scored)
    
    return {
        "region": "Rudraprayag & Chamoli, Uttarakhand",
        "total_villages": len(scored),
        "total_population": sum(v["population"] for v in scored),
        "total_households": sum(v["households"] for v in scored),
        "high_risk_villages": len(high_risk),
        "immediate_priority": priority_counts.get("Immediate", 0),
        "population_at_risk": sum(v["population"] for v in high_risk),
        "zone_counts": zone_counts,
        "priority_counts": priority_counts,
        "avg_landslide_probability": avg_ml_prob,
        "total_predicted_relocation_demand_families": total_demand,
        "villages_with_ml_assessment": len(scored),
        "ml_status": "Operational",
    }
