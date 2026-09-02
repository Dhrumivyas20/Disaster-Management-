import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import init_db

# Initialize database
init_db()
client = TestClient(app)

def test_health_check():
    response = client.get("/api/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert "ml_models" in data


def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "region" in data
    assert data["total_villages"] > 0
    assert data["total_population"] > 0
    assert "zone_counts" in data
    assert "priority_counts" in data
    assert data["zone_counts"]["Red"] >= 0


def test_get_zones():
    response = client.get("/api/zones")
    assert response.status_code == 200
    zones = response.json()
    assert len(zones) > 0
    first = zones[0]
    assert "village_id" in first
    assert "village_name" in first
    assert "lat" in first
    assert "lon" in first
    assert "zone_color" in first
    assert first["zone_color"] in ["Red", "Orange", "Yellow", "Green"]
    assert "hazard_score" in first


def test_get_villages_all():
    response = client.get("/api/villages")
    assert response.status_code == 200
    villages = response.json()
    assert len(villages) == 20
    
    # Check Joshimath
    joshimath = next((v for v in villages if v["village_id"] == "V001"), None)
    assert joshimath is not None
    assert joshimath["village_name"] == "Joshimath"
    assert joshimath["hazard_score"] >= 0.7  # High risk zone
    assert joshimath["zone_color"] == "Red"
    assert joshimath["priority_bucket"] == "Immediate"


def test_get_villages_filter():
    # Filter by search
    res_search = client.get("/api/villages?search=Kedarnath")
    assert res_search.status_code == 200
    results = res_search.json()
    assert len(results) == 1
    assert "Kedarnath" in results[0]["village_name"]
    
    # Filter by zone
    res_zone = client.get("/api/villages?zone=Red")
    assert res_zone.status_code == 200
    for v in res_zone.json():
        assert v["zone_color"] == "Red"

    # Filter by priority
    res_pri = client.get("/api/villages?priority=Immediate")
    assert res_pri.status_code == 200
    for v in res_pri.json():
        assert v["priority_bucket"] == "Immediate"


def test_get_village_detail():
    response = client.get("/api/villages/V001")
    assert response.status_code == 200
    v = response.json()
    assert v["village_id"] == "V001"
    assert "nearby_facilities" in v
    assert len(v["nearby_facilities"]) > 0
    first_facility = v["nearby_facilities"][0]
    assert "name" in first_facility
    assert "distance_km" in first_facility


def test_get_village_detail_not_found():
    response = client.get("/api/villages/V999_NON_EXISTENT")
    assert response.status_code == 404


def test_get_priority_villages():
    response = client.get("/api/priority")
    assert response.status_code == 200
    priorities = response.json()
    assert len(priorities) > 0
    # Check descending order of priority score
    for i in range(len(priorities) - 1):
        assert priorities[i]["priority_score"] >= priorities[i+1]["priority_score"]
    # Check score breakdown
    first = priorities[0]
    assert "score_breakdown" in first
    assert "hazard_exposure" in first["score_breakdown"]
    assert "population_pressure" in first["score_breakdown"]


def test_get_relocation_recommendations():
    response = client.get("/api/relocation/V001")
    assert response.status_code == 200
    data = response.json()
    assert "village" in data
    assert "criteria_weights" in data
    assert "recommendations" in data
    assert len(data["recommendations"]) == 10
    
    top_site = data["recommendations"][0]
    assert top_site["rank"] == 1
    assert "suitability_score" in top_site
    assert "carrying_capacity" in top_site
    assert "available_capacity" in top_site
    assert "capacity_status" in top_site
    assert top_site["capacity_status"] in ["Ready", "Limited", "Insufficient"]
    assert "score_breakdown" in top_site


def test_get_facilities():
    response = client.get("/api/facilities")
    assert response.status_code == 200
    facilities = response.json()
    assert len(facilities) == 20
    
    # Filter by type
    res_hosp = client.get("/api/facilities?type=hospital")
    assert res_hosp.status_code == 200
    for f in res_hosp.json():
        assert f["type"] == "hospital"


def test_ml_predict_endpoint():
    payload = {
        "lat": 30.5548,
        "lon": 79.5651,
        "population": 16709,
        "households": 3800,
        "existing_hazard_zone": "High",
        "historical_incidents": 1,
    }
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert "landslide_probability" in res
    assert 0.0 <= res["landslide_probability"] <= 1.0
    assert "awaiting_families_estimate" in res
    assert "predicted_movement_type" in res
    assert res["risk_level"] in ["High", "Moderate", "Low"]


def test_ml_metadata():
    response = client.get("/api/ml/metadata")
    assert response.status_code == 200
    meta = response.json()
    assert "models" in meta
    assert "landslide_probability" in meta["models"]
