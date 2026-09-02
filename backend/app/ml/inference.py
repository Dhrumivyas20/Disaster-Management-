"""
Production ML Inference Module for Hazard Intelligence.
Provides bounded, validated, explainable predictions with safe deterministic fallbacks.
"""

import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import joblib

from app.ml.features import extract_features, FEATURE_COLUMNS, HAZARD_ZONE_MAP

logger = logging.getLogger("pixelalchemy.ml")

class HazardPredictor:
    """Singleton inference manager for hazard intelligence models."""
    
    _instance = None
    
    def __init__(self):
        self.model_dir = Path(__file__).resolve().parent
        self.landslide_model = None
        self.demand_model = None
        self.movement_model = None
        self._load_models()
        
    @classmethod
    def get_instance(cls) -> "HazardPredictor":
        if cls._instance is None:
            cls._instance = HazardPredictor()
        return cls._instance
        
    def _load_models(self) -> None:
        """Safely load serialized model artifacts."""
        try:
            prob_path = self.model_dir / "landslide_model.joblib"
            if prob_path.exists():
                self.landslide_model = joblib.load(prob_path)
                logger.info(f"Loaded Landslide Probability model from {prob_path}")
            else:
                logger.warning(f"Model artifact not found at {prob_path}, fallback will be used.")
        except Exception as e:
            logger.error(f"Failed to load landslide probability model: {e}")
            self.landslide_model = None
            
        try:
            demand_path = self.model_dir / "relocation_demand_model.joblib"
            if demand_path.exists():
                self.demand_model = joblib.load(demand_path)
        except Exception as e:
            logger.warning(f"Failed to load demand model: {e}")
            self.demand_model = None
            
        try:
            movement_path = self.model_dir / "movement_classifier.joblib"
            if movement_path.exists():
                self.movement_model = joblib.load(movement_path)
        except Exception as e:
            logger.warning(f"Failed to load movement model: {e}")
            self.movement_model = None

    def predict_landslide_probability(
        self,
        village_data: Dict[str, Any],
        facilities: Optional[List[Dict[str, Any]]] = None
    ) -> float:
        """
        Predict landslide probability in range [0.0, 1.0].
        If ML inference fails, returns an auditable deterministic fallback.
        """
        if self.landslide_model is not None:
            try:
                X = extract_features(village_data, facilities)
                raw_pred = float(self.landslide_model.predict(X)[0])
                # Bound strictly between 0.0 and 1.0
                return round(float(np.clip(raw_pred, 0.0, 1.0)), 3)
            except Exception as e:
                logger.warning(f"ML inference error: {e}. Using deterministic fallback.")
                
        # Deterministic fallback calculation
        zone = str(village_data.get("existing_hazard_zone", "Moderate"))
        incidents = float(village_data.get("historical_incidents", 0))
        zone_val = HAZARD_ZONE_MAP.get(zone, 0.55)
        fallback = (zone_val * 0.5) + (min(incidents, 1.0) * 0.5)
        return round(float(np.clip(fallback, 0.0, 1.0)), 3)

    def predict_relocation_demand(
        self,
        village_data: Dict[str, Any],
        facilities: Optional[List[Dict[str, Any]]] = None
    ) -> int:
        """Predict estimated awaiting families requiring relocation."""
        if self.demand_model is not None:
            try:
                X = extract_features(village_data, facilities)
                pred = float(self.demand_model.predict(X)[0])
                return max(0, int(round(pred)))
            except Exception as e:
                logger.warning(f"Demand inference error: {e}")
                
        # Deterministic fallback: estimated percentage of households
        households = int(village_data.get("households", 100))
        zone = str(village_data.get("existing_hazard_zone", "Moderate"))
        ratio = 0.25 if zone == "High" else (0.05 if zone == "Moderate" else 0.01)
        return max(0, int(households * ratio))

    def predict_movement_type(
        self,
        village_data: Dict[str, Any],
        facilities: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Predict likely movement type classification."""
        if self.movement_model is not None:
            try:
                X = extract_features(village_data, facilities)
                pred = str(self.movement_model.predict(X)[0])
                return pred
            except Exception as e:
                logger.warning(f"Movement inference error: {e}")
                
        # Fallback
        zone = str(village_data.get("existing_hazard_zone", "Moderate"))
        return "Debris Flow" if zone == "High" else "Rotational Slide"

# Module-level convenience functions
def get_landslide_probability(
    village_data: Dict[str, Any],
    facilities: Optional[List[Dict[str, Any]]] = None
) -> float:
    return HazardPredictor.get_instance().predict_landslide_probability(village_data, facilities)

def get_relocation_demand(
    village_data: Dict[str, Any],
    facilities: Optional[List[Dict[str, Any]]] = None
) -> int:
    return HazardPredictor.get_instance().predict_relocation_demand(village_data, facilities)

def get_movement_type(
    village_data: Dict[str, Any],
    facilities: Optional[List[Dict[str, Any]]] = None
) -> str:
    return HazardPredictor.get_instance().predict_movement_type(village_data, facilities)
