from sqlalchemy import Column, String, Integer, Float
from app.db.base import Base


class Facility(Base):
    __tablename__ = "facilities"

    facility_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # hospital, school, water_source
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)


class CandidateSite(Base):
    __tablename__ = "candidate_sites"

    site_id = Column(String, primary_key=True, index=True)
    site_name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    land_availability = Column(String, nullable=False)  # High, Medium
    existing_population = Column(Integer, nullable=False)
    hazard_zone = Column(String, nullable=False)  # Yellow, Green
    distance_to_road_km = Column(Float, nullable=False)
    distance_to_water_km = Column(Float, nullable=False)
    distance_to_healthcare_km = Column(Float, nullable=False)