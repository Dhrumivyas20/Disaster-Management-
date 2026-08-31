# PixelAlchemy — Revised Implementation Plan (No ML Training, CSV-Based)
### SIH26191: Hazard-Based Red Zones, Carrying Capacity & Relocation System

**Demo region:** Rudraprayag & Chamoli districts, Uttarakhand
**Approach:** Rule-based weighted scoring instead of trained ML models. Static curated CSVs instead of raw GIS/Census pipelines. No PostGIS required — pandas + JSON is enough.

This cuts your build to 4 lightweight sections. No raster processing, no model training, no live data feeds.

---

## 0. Full Repository Structure

```
pixelalchemy/
├── data/
│   ├── villages.csv                 # already generated
│   ├── facilities.csv               # already generated
│   └── candidate_sites.csv          # already generated
├── scoring/                         # replaces the old "ml/" section
│   ├── hazard_scoring.py
│   ├── priority_index.py
│   ├── ahp_suitability.py
│   ├── config_weights.py
│   └── run_pipeline.py
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── data_loader.py
│   │   ├── routers/
│   │   │   ├── zones.py
│   │   │   ├── villages.py
│   │   │   ├── priority.py
│   │   │   └── relocation.py
│   │   └── schemas/
│   │       ├── village_schema.py
│   │       └── relocation_schema.py
│   ├── requirements.txt
│   └── Dockerfile (optional)
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── MapView.tsx
│   │   ├── ZoneLegend.tsx
│   │   ├── VillagePopup.tsx
│   │   ├── PrioritySidebar.tsx
│   │   ├── RelocationPanel.tsx
│   │   └── ScoreBreakdownChart.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── types.ts
│   └── package.json
├── docker-compose.yml (optional — only if you containerize)
└── README.md
```

No `ml/models/`, no `ml/training/`, no PostGIS setup, no Overpass/GSI/Census download scripts. Everything reads directly from the 3 CSVs.

---

## SECTION A — SCORING (replaces "ML Pipeline") — Owner: Akshat

**Goal:** Compute hazard zone, priority bucket, and relocation site ranking using plain weighted formulas on the CSV data. No training, no model files.

### Folder: `scoring/`

- **`config_weights.py`**
  Central place for all tunable weights and thresholds, so you can adjust scoring without touching logic code:
  ```python
  HAZARD_WEIGHTS = {
      "existing_hazard_zone": 0.5,   # High/Moderate/Yellow -> numeric
      "historical_incidents": 0.5
  }
  ZONE_THRESHOLDS = {"red": 0.7, "orange": 0.45, "yellow": 0.2}

  PRIORITY_WEIGHTS = {
      "hazard_score": 0.4,
      "population": 0.3,
      "households": 0.1,
      "historical_incidents": 0.2
  }

  AHP_WEIGHTS = {
      "hazard_zone": 0.30,
      "land_availability": 0.25,
      "distance_to_road_km": 0.15,
      "distance_to_water_km": 0.15,
      "distance_to_healthcare_km": 0.15
  }
  ```

- **`hazard_scoring.py`**
  Reads `villages.csv`. Converts `existing_hazard_zone` (High/Moderate/Yellow) into a numeric base score (e.g. High=1.0, Moderate=0.5, Yellow=0.2), adds `historical_incidents` flag, computes a weighted `hazard_score` per village, and buckets into Red/Orange/Yellow/Green using `ZONE_THRESHOLDS`. Outputs `villages_scored.csv` (or JSON) with an added `hazard_score` and `zone_color` column.

- **`priority_index.py`**
  Reads `villages_scored.csv`. Normalizes `population`, `households`, `historical_incidents` (min-max scaling), computes weighted `priority_score` using `PRIORITY_WEIGHTS`, and classifies into `Immediate / Short-term / Medium-term / Monitor` using simple score cutoffs you define (e.g. top 25% = Immediate). Outputs `villages_priority.json` — this is your final "at-risk villages ranked" dataset.

- **`ahp_suitability.py`**
  Reads `candidate_sites.csv`. For each candidate site, normalizes each criterion (hazard_zone converted to numeric safety score, land_availability High/Medium→numeric, and the three distance columns inverted so "closer is better"), computes `S = Σ(wi × ci)` using `AHP_WEIGHTS`, and ranks all candidates. Optionally computes distance from each at-risk village to each candidate site using the haversine formula (plain Python, no GIS library needed) to filter to only nearby candidates per village. Outputs `relocation_candidates.json` — village → ranked list of sites with per-criterion score breakdown (needed for your explainability UI).

- **`run_pipeline.py`**
  One script that runs all three in order and writes final JSON files to a shared `data/processed/` folder that the backend reads directly:
  ```python
  # run_pipeline.py
  from hazard_scoring import run as run_hazard
  from priority_index import run as run_priority
  from ahp_suitability import run as run_ahp

  run_hazard()
  run_priority()
  run_ahp()
  print("Pipeline complete. Outputs in data/processed/")
  ```

### Key deliverable
Three output files in `data/processed/`: `villages_scored.json`, `villages_priority.json`, `relocation_candidates.json`. These are static — you run `run_pipeline.py` once, and the backend just serves the results. No live computation needed during the demo (though you can re-run live to show it working if judges ask).

---

## SECTION B — BACKEND — Owner: Kunal

**Goal:** Serve the precomputed JSON outputs via FastAPI. No database required — just read JSON/CSV files into memory on startup.

### Folder: `backend/`

- **`app/data_loader.py`** — Loads `villages.csv`, `facilities.csv`, and the three processed JSON files from `scoring/` into pandas DataFrames / dicts at app startup. Single source of truth for all routers.
- **`app/main.py`** — FastAPI app, CORS enabled for the frontend, registers routers, calls `data_loader` on startup.
- **`app/routers/zones.py`** — `GET /api/zones` → returns all villages with `lat, lon, zone_color` (enough for the frontend to place colored markers; skip full GeoJSON polygons since you don't have shapefiles anymore — point markers are fine for a hackathon demo).
- **`app/routers/villages.py`** — `GET /api/villages` (list with hazard_score + zone_color), `GET /api/villages/{id}` (full detail: population, households, hazard_score, priority bucket).
- **`app/routers/priority.py`** — `GET /api/priority` → returns `villages_priority.json` sorted by bucket (Immediate first).
- **`app/routers/relocation.py`** — `GET /api/relocation/{village_id}` → returns ranked candidate sites + AHP score breakdown for that village from `relocation_candidates.json`.
- **`app/schemas/village_schema.py`, `relocation_schema.py`** — Pydantic response models for typed, clean API output.

### Key deliverable
`uvicorn app.main:app --reload` → 4 working endpoints, testable in `/docs`, with zero database setup. This removes your biggest infra risk (DB connectivity failing during a live demo).

---

## SECTION C — FRONTEND — Owner: Anany + Amulya

**Goal:** Same as before — map + sidebar dashboard. No changes needed here since it was always designed to consume API JSON, not raw GIS data directly.

### Folder: `frontend/` (unchanged from original plan)

- **`MapView.tsx`** — Since you no longer have polygon zones, render villages as **colored circle markers** (red/orange/yellow/green) sized by population — simpler than polygon overlays and still visually strong on a map (Leaflet `CircleMarker` is a one-liner).
- **`VillagePopup.tsx`**, **`PrioritySidebar.tsx`**, **`RelocationPanel.tsx`**, **`ScoreBreakdownChart.tsx`** — all unchanged, just point at the new lighter backend endpoints.
- **`lib/api.ts`** — Same fetch wrapper functions, same endpoint paths.

### Key deliverable
Unchanged from before: map with colored village markers → click → popup with stats/priority → "Find Safe Site" → ranked list with score bars.

---

## Build Order (updated, much shorter)

1. **CSVs** — done already.
2. **Scoring section** (Akshat) — write `config_weights.py` → `hazard_scoring.py` → `priority_index.py` → `ahp_suitability.py` → `run_pipeline.py`. Run once, verify the 3 JSON outputs look sane (open them, sanity-check a few villages).
3. **Backend** (Kunal) — build `data_loader.py` + 4 routers reading those JSONs. Can start writing router *shapes* with hardcoded sample JSON in parallel with step 2, then swap in real files once ready.
4. **Frontend** (Anany/Amulya) — build against backend endpoints (or hardcoded mock JSON matching the schema, in parallel with step 3).

No step requires PostGIS, Docker for a database, raster processing, GSI/Census downloads, or model training. This should be buildable in 2-3 days instead of a week.

---

## What you can still say in your pitch (without lying about "ML")

- Call it a **"multi-criteria weighted risk index"** and **"AHP-based decision support"** — both are legitimate, established techniques (not deep learning, but real quantitative methods used in disaster-risk literature — your own reference #6 and #8 use exactly this).
- Emphasize **explainability**: because it's formula-based, every score is fully auditable and traceable to specific criteria — arguably a *stronger* pitch for a government-facing tool than an opaque ML model.
- Frame the current dataset as an **illustrative pilot** on Rudraprayag/Chamoli, with a clear path to scale: "swap in real IMD/Census/GSI feeds via the same scoring pipeline, no architecture change needed."

---

## Section Ownership Summary

| Section | Owner(s) | Folder |
|---|---|---|
| Scoring (rule-based, replaces ML) | Akshat | `scoring/` |
| Backend | Kunal | `backend/` |
| Frontend | Anany, Amulya | `frontend/` |
| Data (already done) | Dhrumi, Anshul | `data/` |
