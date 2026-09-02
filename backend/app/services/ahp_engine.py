"""
Analytic Hierarchy Process (AHP) & Carrying-Capacity Verification Engine
Evaluates and ranks safe candidate relocation sites for displaced villages.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.village import Village
from app.models.facility import CandidateSite
from app.services.risk_engine import AHP_WEIGHTS, min_max, add_village_scores


def score_site(
    site: CandidateSite,
    village_population: int,
    all_sites: Optional[List[CandidateSite]] = None
) -> dict:
    """
    Score a candidate site using AHP multi-criteria evaluation + carrying-capacity constraint.
    """
    sites_pool = all_sites if all_sites else [site]
    
    road_distances = [s.distance_to_road_km for s in sites_pool]
    water_distances = [s.distance_to_water_km for s in sites_pool]
    healthcare_distances = [s.distance_to_healthcare_km for s in sites_pool]
    
    # Proximity scores (closer is better: 1 - normalized_distance)
    distance_to_road = 1.0 - min_max(site.distance_to_road_km, road_distances)
    distance_to_water = 1.0 - min_max(site.distance_to_water_km, water_distances)
    distance_to_healthcare = 1.0 - min_max(site.distance_to_healthcare_km, healthcare_distances)
    
    hazard_safety = 1.0 if site.hazard_zone == "Green" else 0.65
    land_score = 1.0 if site.land_availability == "High" else 0.65
    
    capacity_limit = 12000 if site.land_availability == "High" else 6500
    available_capacity = max(capacity_limit - site.existing_population, 0)
    
    # Carrying capacity verification against village demand
    if available_capacity >= village_population:
        capacity_status = "Ready"
        capacity_adjustment = 0.08
    elif available_capacity > village_population * 0.35:
        capacity_status = "Limited"
        capacity_adjustment = 0.00
    else:
        capacity_status = "Insufficient"
        capacity_adjustment = -0.12
    
    base_score = (
        hazard_safety * AHP_WEIGHTS["hazard_zone"] +
        land_score * AHP_WEIGHTS["land_availability"] +
        distance_to_road * AHP_WEIGHTS["distance_to_road_km"] +
        distance_to_water * AHP_WEIGHTS["distance_to_water_km"] +
        distance_to_healthcare * AHP_WEIGHTS["distance_to_healthcare_km"]
    )
    
    suitability_score = round(max(0.0, min(1.0, base_score + capacity_adjustment)), 3)
    
    return {
        "site_id": site.site_id,
        "site_name": site.site_name,
        "lat": site.lat,
        "lon": site.lon,
        "land_availability": site.land_availability,
        "existing_population": site.existing_population,
        "hazard_zone": site.hazard_zone,
        "distance_to_road_km": site.distance_to_road_km,
        "distance_to_water_km": site.distance_to_water_km,
        "distance_to_healthcare_km": site.distance_to_healthcare_km,
        "carrying_capacity": capacity_limit,
        "available_capacity": available_capacity,
        "capacity_status": capacity_status,
        "suitability_score": suitability_score,
        "rank": 0,
        "score_breakdown": {
            "hazard_safety": round(hazard_safety * AHP_WEIGHTS["hazard_zone"], 3),
            "land_availability": round(land_score * AHP_WEIGHTS["land_availability"], 3),
            "road_access": round(distance_to_road * AHP_WEIGHTS["distance_to_road_km"], 3),
            "water_access": round(distance_to_water * AHP_WEIGHTS["distance_to_water_km"], 3),
            "healthcare_access": round(distance_to_healthcare * AHP_WEIGHTS["distance_to_healthcare_km"], 3),
        },
    }


def get_relocation_recommendations(db: Session, village_id: str) -> Optional[dict]:
    """Rank candidate sites for a specific village using ML demand filtering + AHP."""
    village = db.query(Village).filter(Village.village_id == village_id).first()
    if not village:
        return None
    
    sites = db.query(CandidateSite).order_by(CandidateSite.site_id).all()
    all_villages = db.query(Village).all()
    scored_villages = add_village_scores([village], all_context_villages=all_villages)
    village_scored = scored_villages[0]
    
    recommendations = [score_site(site, village.population, sites) for site in sites]
    recommendations.sort(key=lambda x: x["suitability_score"], reverse=True)
    for i, site in enumerate(recommendations):
        site["rank"] = i + 1
        
    awaiting_fams = village_scored.get("awaiting_families_estimate", 0)
    
    return {
        "village": village_scored,
        "ml_relocation_demand_families": awaiting_fams,
        "required_capacity_families": awaiting_fams,
        "candidate_sites_count": len(recommendations),
        "criteria_weights": AHP_WEIGHTS,
        "recommendations": recommendations,
    }
