"""Feature extraction and preprocessing pipeline for Landslide Hazard ML Models."""

import math
from typing import Dict, Any, List, Optional
import numpy as np

FEATURE_COLUMNS: List[str] = [
    "lat",
    "lon",
    "population",
    "households",
    "household_density",
    "historical_incidents",
    "hazard_zone_encoded",
    "nearest_water_dist_km",
    "nearest_hospital_dist_km",
]

HAZARD_ZONE_MAP: Dict[str, float] = {
    "High": 1.0,
    "Moderate": 0.55,
    "Yellow": 0.25,
    "Green": 0.05,
}

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two coordinates in kilometers."""
    earth_radius = 6371.0
    lat_delta = math.radians(lat2 - lat1)
    lon_delta = math.radians(lon2 - lon1)
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    a = (math.sin(lat_delta / 2) ** 2 +
         math.sin(lon_delta / 2) ** 2 * math.cos(lat1_rad) * math.cos(lat2_rad))
    return earth_radius * 2 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))


def extract_features(
    village_data: Dict[str, Any],
    facilities: Optional[List[Dict[str, Any]]] = None
) -> np.ndarray:
    """
    Extract and validate ML feature vector from a village record and optional facilities.
    Preserves exact column ordering defined in FEATURE_COLUMNS.
    """
    lat = float(village_data.get("lat", 30.5))
    lon = float(village_data.get("lon", 79.2))
    population = float(village_data.get("population", 1000))
    households = float(village_data.get("households", max(1.0, population / 4.5)))
    household_density = population / max(1.0, households)
    historical_incidents = float(village_data.get("historical_incidents", 0))
    
    zone_str = str(village_data.get("existing_hazard_zone", "Moderate"))
    hazard_zone_encoded = HAZARD_ZONE_MAP.get(zone_str, 0.55)
    
    # Calculate proximity to water and hospital if facilities are provided
    nearest_water_dist_km = 5.0
    nearest_hospital_dist_km = 10.0
    
    if facilities:
        water_dists = [
            haversine_km(lat, lon, f["lat"], f["lon"])
            for f in facilities if f.get("type") == "water_source"
        ]
        if water_dists:
            nearest_water_dist_km = min(water_dists)
            
        hospital_dists = [
            haversine_km(lat, lon, f["lat"], f["lon"])
            for f in facilities if f.get("type") == "hospital"
        ]
        if hospital_dists:
            nearest_hospital_dist_km = min(hospital_dists)
    elif "nearest_water_dist_km" in village_data:
        nearest_water_dist_km = float(village_data["nearest_water_dist_km"])
        nearest_hospital_dist_km = float(village_data.get("nearest_hospital_dist_km", 10.0))

    feature_dict = {
        "lat": lat,
        "lon": lon,
        "population": population,
        "households": households,
        "household_density": household_density,
        "historical_incidents": historical_incidents,
        "hazard_zone_encoded": hazard_zone_encoded,
        "nearest_water_dist_km": nearest_water_dist_km,
        "nearest_hospital_dist_km": nearest_hospital_dist_km,
    }
    
    return np.array([[feature_dict[col] for col in FEATURE_COLUMNS]], dtype=np.float32)
