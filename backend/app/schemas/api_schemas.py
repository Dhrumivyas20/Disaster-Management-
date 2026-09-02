from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


class HealthStatus(BaseModel):
    status: str = "healthy"
    database: str = "connected"
    ml_models: str = "ready"


ZoneColorType = Literal["Red", "Orange", "Yellow", "Green"]
PriorityBucketType = Literal["Immediate", "Short-term", "Medium-term", "Monitor"]


class DashboardSummary(BaseModel):
    region: str
    total_villages: int
    total_population: int
    total_households: int
    high_risk_villages: int
    immediate_priority: int
    population_at_risk: int
    zone_counts: Dict[str, int]
    priority_counts: Dict[str, int]
    avg_landslide_probability: Optional[float] = 0.0
    total_predicted_relocation_demand_families: Optional[int] = 0
    villages_with_ml_assessment: Optional[int] = 0
    ml_status: Optional[str] = "Operational"


class ZoneMarker(BaseModel):
    village_id: str
    village_name: str
    lat: float
    lon: float
    zone_color: str
    hazard_score: float
    population: int
    households: Optional[int] = 0
    historical_incidents: Optional[int] = 0
    deterministic_hazard_score: Optional[float] = 0.0
    landslide_ml_score: Optional[float] = 0.0
    landslide_probability: Optional[float] = 0.0
    predicted_movement_type: Optional[str] = None
    awaiting_families_estimate: Optional[int] = 0
    priority_score: Optional[float] = 0.0
    priority_bucket: Optional[str] = "Monitor"


class Facility(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    facility_id: str
    name: str
    type: str  # hospital, school, water_source
    lat: float
    lon: float
    distance_km: Optional[float] = None


class Village(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    village_id: str
    village_name: str
    lat: float
    lon: float
    population: int
    households: int
    existing_hazard_zone: str
    historical_incidents: int
    deterministic_hazard_score: Optional[float] = 0.0
    hazard_score: float
    zone_color: str
    priority_score: float
    priority_bucket: str
    landslide_ml_score: Optional[float] = 0.0
    landslide_probability: Optional[float] = 0.0
    awaiting_families_estimate: Optional[int] = 0
    predicted_movement_type: Optional[str] = None
    ml_fusion_formula: Optional[str] = "70% Deterministic + 30% ML"
    why_priority_reasons: Optional[List[str]] = Field(default_factory=list)


class VillageDetail(Village):
    nearby_facilities: List[Facility] = Field(default_factory=list)


class VillagePriority(Village):
    score_breakdown: Dict[str, float] = Field(default_factory=dict)


class RelocationSite(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    site_id: str
    site_name: str
    lat: float
    lon: float
    land_availability: str
    existing_population: int
    hazard_zone: str
    distance_to_road_km: float
    distance_to_water_km: float
    distance_to_healthcare_km: float
    carrying_capacity: int
    available_capacity: int
    capacity_status: str
    suitability_score: float
    rank: int
    score_breakdown: Dict[str, float] = Field(default_factory=dict)


class RelocationResponse(BaseModel):
    village: Village
    ml_relocation_demand_families: Optional[int] = 0
    required_capacity_families: Optional[int] = 0
    candidate_sites_count: Optional[int] = 10
    criteria_weights: Dict[str, float]
    recommendations: List[RelocationSite]


class MLPredictionRequest(BaseModel):
    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")
    population: float = Field(..., description="Village population")
    households: Optional[float] = Field(None, description="Number of households")
    existing_hazard_zone: Optional[str] = Field("Moderate", description="High, Moderate, Yellow, Green")
    historical_incidents: Optional[int] = Field(0, description="Past incident count")
    nearest_water_dist_km: Optional[float] = Field(None, description="Distance to river/water in km")
    nearest_hospital_dist_km: Optional[float] = Field(None, description="Distance to hospital in km")


class MLPredictionResponse(BaseModel):
    landslide_probability: float
    awaiting_families_estimate: int
    predicted_movement_type: str
    risk_level: str
    is_fallback: bool = False
    feature_contributions: Dict[str, float] = Field(default_factory=dict)
