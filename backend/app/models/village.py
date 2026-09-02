from sqlalchemy import Column, String, Integer, Float, Text
from app.db.base import Base


class Village(Base):
    __tablename__ = "villages"

    village_id = Column(String, primary_key=True, index=True)
    village_name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    population = Column(Integer, nullable=False)
    households = Column(Integer, nullable=False)
    existing_hazard_zone = Column(String, nullable=False)  # High, Moderate, Yellow
    historical_incidents = Column(Integer, nullable=False, default=0)
    landslide_ml_score = Column(Float, nullable=False, default=0.0)  # ML enrichment