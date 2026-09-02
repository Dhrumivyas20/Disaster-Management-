import csv
import logging
from pathlib import Path
from sqlalchemy.orm import Session
from app.models.village import Village
from app.models.facility import Facility, CandidateSite

logger = logging.getLogger("pixelalchemy.seed")

def find_data_dir() -> Path:
    """Locate the data directory containing CSV files."""
    possible_paths = [
        Path(__file__).resolve().parent.parent.parent.parent / "data",
        Path(__file__).resolve().parent.parent.parent / "data",
        Path.cwd() / "data",
    ]
    for p in possible_paths:
        if p.exists() and (p / "villages.csv").exists():
            return p
    return possible_paths[0]


def seed_database(db: Session) -> None:
    """Seed villages, facilities, and candidate sites from CSV files if empty."""
    data_dir = find_data_dir()
    
    # 1. Villages
    village_count = db.query(Village).count()
    if village_count == 0:
        villages_file = data_dir / "villages.csv"
        if villages_file.exists():
            villages = []
            with open(villages_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    villages.append(
                        Village(
                            village_id=row["village_id"],
                            village_name=row["village_name"],
                            lat=float(row["lat"]),
                            lon=float(row["lon"]),
                            population=int(row["population"]),
                            households=int(row["households"]),
                            existing_hazard_zone=row["existing_hazard_zone"],
                            historical_incidents=int(row.get("historical_incidents", 0)),
                            landslide_ml_score=0.0,
                        )
                    )
            if villages:
                db.bulk_save_objects(villages)
                db.commit()
                logger.info(f"Seeded {len(villages)} villages from {villages_file.name}")
        else:
            logger.warning(f"Villages CSV not found at {villages_file}")
    
    # 2. Facilities
    facility_count = db.query(Facility).count()
    if facility_count == 0:
        facilities_file = data_dir / "facilities.csv"
        if facilities_file.exists():
            facilities = []
            with open(facilities_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    facilities.append(
                        Facility(
                            facility_id=row["facility_id"],
                            name=row["name"],
                            type=row["type"],
                            lat=float(row["lat"]),
                            lon=float(row["lon"]),
                        )
                    )
            if facilities:
                db.bulk_save_objects(facilities)
                db.commit()
                logger.info(f"Seeded {len(facilities)} facilities from {facilities_file.name}")
        else:
            logger.warning(f"Facilities CSV not found at {facilities_file}")
            
    # 3. Candidate Sites
    candidate_count = db.query(CandidateSite).count()
    if candidate_count == 0:
        sites_file = data_dir / "candidate_sites.csv"
        if sites_file.exists():
            sites = []
            with open(sites_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sites.append(
                        CandidateSite(
                            site_id=row["site_id"],
                            site_name=row["site_name"],
                            lat=float(row["lat"]),
                            lon=float(row["lon"]),
                            land_availability=row["land_availability"],
                            existing_population=int(row["existing_population"]),
                            hazard_zone=row["hazard_zone"],
                            distance_to_road_km=float(row["distance_to_road_km"]),
                            distance_to_water_km=float(row["distance_to_water_km"]),
                            distance_to_healthcare_km=float(row["distance_to_healthcare_km"]),
                        )
                    )
            if sites:
                db.bulk_save_objects(sites)
                db.commit()
                logger.info(f"Seeded {len(sites)} candidate sites from {sites_file.name}")
        else:
            logger.warning(f"Candidate sites CSV not found at {sites_file}")
