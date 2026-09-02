"""
FastAPI REST API Routes for PixelAlchemy Risk Dashboard.
Implements the full OpenAPI specification with database persistence, ML intelligence, and AHP suitability.
"""

import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.risk_engine import (
    get_zone_markers,
    get_village_detail,
    get_priority_villages,
    get_dashboard_summary,
    add_village_scores,
    get_hazard_score,
)
from app.services.ahp_engine import get_relocation_recommendations
from app.models.village import Village as VillageModel
from app.models.facility import Facility as FacilityModel, CandidateSite as CandidateSiteModel
from app.schemas.api_schemas import (
    HealthStatus,
    DashboardSummary,
    ZoneMarker,
    Village,
    VillageDetail,
    VillagePriority,
    Facility as FacilitySchema,
    RelocationResponse,
    MLPredictionRequest,
    MLPredictionResponse,
)
from app.ml import (
    get_landslide_probability,
    get_relocation_demand,
    get_movement_type,
    HazardPredictor,
)

router = APIRouter()


@router.get("/healthz", response_model=HealthStatus, tags=["health"])
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint confirming API, database, and ML status."""
    try:
        db.query(VillageModel).count()
        db_status = "connected"
    except Exception:
        db_status = "error"
        
    predictor = HazardPredictor.get_instance()
    ml_status = "ready" if predictor.landslide_model is not None else "fallback_active"
    
    return HealthStatus(
        status="healthy",
        database=db_status,
        ml_models=ml_status
    )


@router.get("/dashboard/summary", response_model=DashboardSummary, tags=["dashboard"])
async def get_dashboard_summary_endpoint(db: Session = Depends(get_db)):
    """Returns aggregated exposure statistics and zone distributions."""
    return get_dashboard_summary(db)


@router.get("/zones", response_model=List[ZoneMarker], tags=["villages"])
async def get_zones(db: Session = Depends(get_db)):
    """Returns map coordinate markers with hazard scores and zone colors for the risk heatmap."""
    return get_zone_markers(db)


@router.get("/villages", response_model=List[Village], tags=["villages"])
async def get_villages(
    search: Optional[str] = Query(None, description="Search by name or ID"),
    zone: Optional[str] = Query(None, description="Filter by zone color: Red, Orange, Yellow, Green"),
    priority: Optional[str] = Query(None, description="Filter by priority: Immediate, Short-term, Medium-term, Monitor"),
    db: Session = Depends(get_db),
):
    """List scored villages with search and filtering capabilities."""
    villages = db.query(VillageModel).order_by(VillageModel.village_id).all()
    scored = add_village_scores(villages)
    
    if search:
        s = search.lower().strip()
        scored = [v for v in scored if s in v["village_name"].lower() or s in v["village_id"].lower()]
    if zone:
        scored = [v for v in scored if v["zone_color"] == zone]
    if priority:
        scored = [v for v in scored if v["priority_bucket"] == priority]
    
    return scored


@router.get("/villages/{village_id}", response_model=VillageDetail, tags=["villages"])
async def get_village(village_id: str, db: Session = Depends(get_db)):
    """Retrieve individual village risk detail, factor breakdown, and nearby facilities."""
    village = get_village_detail(db, village_id)
    if not village:
        raise HTTPException(status_code=404, detail=f"Village '{village_id}' not found")
    return village


@router.get("/priority", response_model=List[VillagePriority], tags=["villages"])
async def get_priority(db: Session = Depends(get_db)):
    """Retrieve all villages ordered by relocation urgency with explainable score breakdowns."""
    return get_priority_villages(db)


@router.get("/relocation/{village_id}", response_model=RelocationResponse, tags=["relocation"])
async def get_relocation(village_id: str, db: Session = Depends(get_db)):
    """Evaluate and rank safe candidate relocation sites for a displaced village using AHP."""
    result = get_relocation_recommendations(db, village_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Village '{village_id}' not found")
    return result


@router.get("/facilities", response_model=List[FacilitySchema], tags=["facilities"])
async def get_facilities(
    type: Optional[str] = Query(None, description="Filter by type: hospital, school, water_source"),
    db: Session = Depends(get_db),
):
    """List regional critical facilities (hospitals, schools, water sources)."""
    query = db.query(FacilityModel)
    if type:
        query = query.filter(FacilityModel.type == type)
    facilities = query.order_by(FacilityModel.facility_id).all()
    return [FacilitySchema.model_validate(f) for f in facilities]


# ML Hazard Intelligence Endpoints

@router.post("/ml/predict", response_model=MLPredictionResponse, tags=["ml"])
async def predict_hazard_ml(request: MLPredictionRequest, db: Session = Depends(get_db)):
    """
    Direct ML inference endpoint for Landslide Probability and Relocation Demand.
    """
    facilities = [
        {"lat": f.lat, "lon": f.lon, "type": f.type}
        for f in db.query(FacilityModel).all()
    ]
    
    v_dict = request.model_dump()
    prob = get_landslide_probability(v_dict, facilities)
    demand = get_relocation_demand(v_dict, facilities)
    movement = get_movement_type(v_dict, facilities)
    
    risk_level = "High" if prob >= 0.7 else ("Moderate" if prob >= 0.4 else "Low")
    is_fallback = HazardPredictor.get_instance().landslide_model is None
    
    return MLPredictionResponse(
        landslide_probability=prob,
        awaiting_families_estimate=demand,
        predicted_movement_type=movement,
        risk_level=risk_level,
        is_fallback=is_fallback,
        feature_contributions={
            "terrain_location": round(prob * 0.35, 3),
            "historical_incidents": round((request.historical_incidents or 0) * 0.25, 3),
            "hazard_zone_factor": round(prob * 0.40, 3),
        }
    )


@router.get("/ml/metadata", tags=["ml"])
async def get_ml_metadata():
    """Returns trained model artifacts metadata and validation metrics."""
    meta_path = Path(__file__).resolve().parent.parent / "ml" / "model_metadata.json"
    if meta_path.exists():
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"status": "Model metadata not generated"}
