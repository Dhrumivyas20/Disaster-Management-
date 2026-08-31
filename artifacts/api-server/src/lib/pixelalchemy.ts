import { and, asc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  candidateSitesTable,
  facilitiesTable,
  villagesTable,
  type CandidateSite,
  type Facility,
  type Village,
} from "@workspace/db";

const HAZARD_WEIGHTS = {
  hazard_zone: 0.5,
  historical_incidents: 0.5,
} as const;

export const AHP_WEIGHTS = {
  hazard_zone: 0.3,
  land_availability: 0.25,
  distance_to_road_km: 0.15,
  distance_to_water_km: 0.15,
  distance_to_healthcare_km: 0.15,
} as const;

const hazardValue: Record<string, number> = {
  High: 1,
  Moderate: 0.55,
  Yellow: 0.25,
};

const zoneForScore = (score: number) => {
  if (score >= 0.7) return "Red" as const;
  if (score >= 0.45) return "Orange" as const;
  if (score >= 0.2) return "Yellow" as const;
  return "Green" as const;
};

const minMax = (value: number, values: number[]) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return max === min ? 1 : (value - min) / (max - min);
};

const haversineKm = (
  latitudeOne: number,
  longitudeOne: number,
  latitudeTwo: number,
  longitudeTwo: number,
) => {
  const earthRadius = 6371;
  const latDelta = ((latitudeTwo - latitudeOne) * Math.PI) / 180;
  const lonDelta = ((longitudeTwo - longitudeOne) * Math.PI) / 180;
  const latitudeOneRadians = (latitudeOne * Math.PI) / 180;
  const latitudeTwoRadians = (latitudeTwo * Math.PI) / 180;
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.sin(lonDelta / 2) ** 2 *
      Math.cos(latitudeOneRadians) *
      Math.cos(latitudeTwoRadians);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getHazardScore = (village: Village) =>
  Number(
    (
      hazardValue[village.existingHazardZone] * HAZARD_WEIGHTS.hazard_zone +
      Math.min(village.historicalIncidents, 1) *
        HAZARD_WEIGHTS.historical_incidents
    ).toFixed(3),
  );

export const getZone = (village: Village) => zoneForScore(getHazardScore(village));

export const getPriorityBucket = (score: number) => {
  if (score >= 0.62) return "Immediate" as const;
  if (score >= 0.42) return "Short-term" as const;
  if (score >= 0.22) return "Medium-term" as const;
  return "Monitor" as const;
};

const getVillageRows = async () =>
  db.select().from(villagesTable).orderBy(asc(villagesTable.villageId));

const getFacilityRows = async () =>
  db.select().from(facilitiesTable).orderBy(asc(facilitiesTable.facilityId));

const getCandidateRows = async () =>
  db
    .select()
    .from(candidateSitesTable)
    .orderBy(asc(candidateSitesTable.siteId));

const addVillageScores = (villages: Village[]) => {
  const populations = villages.map((village) => village.population);
  const households = villages.map((village) => village.households);
  const incidents = villages.map((village) => village.historicalIncidents);

  return villages.map((village) => {
    const hazardScore = getHazardScore(village);
    const priorityScore = Number(
      (
        hazardScore * 0.4 +
        minMax(village.population, populations) * 0.3 +
        minMax(village.households, households) * 0.1 +
        minMax(village.historicalIncidents, incidents) * 0.2
      ).toFixed(3),
    );

    return {
      village_id: village.villageId,
      village_name: village.villageName,
      lat: village.lat,
      lon: village.lon,
      population: village.population,
      households: village.households,
      existing_hazard_zone: village.existingHazardZone,
      historical_incidents: village.historicalIncidents,
      hazard_score: hazardScore,
      zone_color: zoneForScore(hazardScore),
      priority_score: priorityScore,
      priority_bucket: getPriorityBucket(priorityScore),
    };
  });
};

export const listVillages = async (filters?: {
  search?: string;
  zone?: string;
  priority?: string;
}) => {
  const scored = addVillageScores(await getVillageRows());
  const search = filters?.search?.trim().toLowerCase();
  return scored.filter((village) => {
    const matchesSearch =
      !search ||
      village.village_name.toLowerCase().includes(search) ||
      village.village_id.toLowerCase().includes(search);
    const matchesZone = !filters?.zone || village.zone_color === filters.zone;
    const matchesPriority =
      !filters?.priority || village.priority_bucket === filters.priority;
    return matchesSearch && matchesZone && matchesPriority;
  });
};

export const getVillageById = async (villageId: string) => {
  const rows = await db
    .select()
    .from(villagesTable)
    .where(eq(villagesTable.villageId, villageId));
  const village = rows[0];
  if (!village) return undefined;
  return addVillageScores([village])[0];
};

export const getVillageDetail = async (villageId: string) => {
  const village = await getVillageById(villageId);
  if (!village) return undefined;

  const facilities = await getFacilityRows();
  const nearbyFacilities = facilities
    .map((facility) => ({
      facility,
      distance: haversineKm(village.lat, village.lon, facility.lat, facility.lon),
    }))
    .filter(({ distance }) => distance <= 35)
    .sort((first, second) => first.distance - second.distance)
    .slice(0, 8)
    .map(({ facility }) => ({
      facility_id: facility.facilityId,
      name: facility.name,
      type: facility.type,
      lat: facility.lat,
      lon: facility.lon,
    }));

  return { ...village, nearby_facilities: nearbyFacilities };
};

export const getZoneMarkers = async () =>
  (await listVillages()).map((village) => ({
    village_id: village.village_id,
    village_name: village.village_name,
    lat: village.lat,
    lon: village.lon,
    zone_color: village.zone_color,
    hazard_score: village.hazard_score,
    population: village.population,
  }));

export const getPriorityVillages = async () => {
  const villages = await listVillages();
  return villages
    .sort((first, second) => second.priority_score - first.priority_score)
    .map((village) => ({
      ...village,
      score_breakdown: {
        hazard_exposure: Number((village.hazard_score * 0.4).toFixed(3)),
        population_pressure: Number(
          (
            (village.population /
              Math.max(...villages.map((item) => item.population))) *
            0.3
          ).toFixed(3),
        ),
        household_exposure: Number(
          (
            (village.households /
              Math.max(...villages.map((item) => item.households))) *
            0.1
          ).toFixed(3),
        ),
        historical_incidents: Number(
          (Math.min(village.historical_incidents, 1) * 0.2).toFixed(3),
        ),
      },
    }));
};

const scoreSite = (site: CandidateSite, village: { population: number }) => {
  const allSites = [site];
  const distanceToRoad = 1 - minMax(site.distanceToRoadKm, allSites.map((item) => item.distanceToRoadKm));
  const distanceToWater = 1 - minMax(site.distanceToWaterKm, allSites.map((item) => item.distanceToWaterKm));
  const distanceToHealthcare = 1 - minMax(site.distanceToHealthcareKm, allSites.map((item) => item.distanceToHealthcareKm));
  const hazardSafety = site.hazardZone === "Green" ? 1 : 0.65;
  const landScore = site.landAvailability === "High" ? 1 : 0.65;
  const capacityLimit = site.landAvailability === "High" ? 12000 : 6500;
  const availableCapacity = Math.max(capacityLimit - site.existingPopulation, 0);
  const population = village.population;
  const capacityStatus =
    availableCapacity >= population
      ? "Ready"
      : availableCapacity > population * 0.35
        ? "Limited"
        : "Insufficient";
  const capacityAdjustment =
    capacityStatus === "Ready" ? 0.08 : capacityStatus === "Limited" ? 0 : -0.12;
  const baseScore =
    hazardSafety * AHP_WEIGHTS.hazard_zone +
    landScore * AHP_WEIGHTS.land_availability +
    distanceToRoad * AHP_WEIGHTS.distance_to_road_km +
    distanceToWater * AHP_WEIGHTS.distance_to_water_km +
    distanceToHealthcare * AHP_WEIGHTS.distance_to_healthcare_km;
  const suitabilityScore = Number(
    Math.max(0, Math.min(1, baseScore + capacityAdjustment)).toFixed(3),
  );

  return {
    site_id: site.siteId,
    site_name: site.siteName,
    lat: site.lat,
    lon: site.lon,
    land_availability: site.landAvailability,
    existing_population: site.existingPopulation,
    hazard_zone: site.hazardZone,
    distance_to_road_km: site.distanceToRoadKm,
    distance_to_water_km: site.distanceToWaterKm,
    distance_to_healthcare_km: site.distanceToHealthcareKm,
    carrying_capacity: capacityLimit,
    available_capacity: availableCapacity,
    capacity_status: capacityStatus,
    suitability_score: suitabilityScore,
    rank: 0,
    score_breakdown: {
      hazard_safety: Number((hazardSafety * AHP_WEIGHTS.hazard_zone).toFixed(3)),
      land_availability: Number((landScore * AHP_WEIGHTS.land_availability).toFixed(3)),
      road_access: Number((distanceToRoad * AHP_WEIGHTS.distance_to_road_km).toFixed(3)),
      water_access: Number((distanceToWater * AHP_WEIGHTS.distance_to_water_km).toFixed(3)),
      healthcare_access: Number((distanceToHealthcare * AHP_WEIGHTS.distance_to_healthcare_km).toFixed(3)),
    },
  };
};

export const getRelocationRecommendations = async (villageId: string) => {
  const village = await getVillageById(villageId);
  if (!village) return undefined;
  const sites = await getCandidateRows();
  const recommendations = sites
    .map((site) => scoreSite(site, village))
    .sort((first, second) => second.suitability_score - first.suitability_score)
    .map((site, index) => ({ ...site, rank: index + 1 }));

  return {
    village,
    criteria_weights: AHP_WEIGHTS,
    recommendations,
  };
};

export const listFacilities = async (type?: string) => {
  const facilities = await getFacilityRows();
  return facilities
    .filter((facility) => !type || facility.type === type)
    .map((facility) => ({
      facility_id: facility.facilityId,
      name: facility.name,
      type: facility.type,
      lat: facility.lat,
      lon: facility.lon,
    }));
};

export const getDashboardSummary = async () => {
  const villages = await listVillages();
  const zoneCounts = villages.reduce<Record<string, number>>((counts, village) => {
    counts[village.zone_color] = (counts[village.zone_color] ?? 0) + 1;
    return counts;
  }, {});
  const priorityCounts = villages.reduce<Record<string, number>>(
    (counts, village) => {
      counts[village.priority_bucket] =
        (counts[village.priority_bucket] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const highRiskVillages = villages.filter(
    (village) => village.zone_color === "Red" || village.zone_color === "Orange",
  );

  return {
    region: "Rudraprayag & Chamoli, Uttarakhand",
    total_villages: villages.length,
    total_population: villages.reduce((total, village) => total + village.population, 0),
    total_households: villages.reduce((total, village) => total + village.households, 0),
    high_risk_villages: highRiskVillages.length,
    immediate_priority: villages.filter(
      (village) => village.priority_bucket === "Immediate",
    ).length,
    population_at_risk: highRiskVillages.reduce(
      (total, village) => total + village.population,
      0,
    ),
    zone_counts: zoneCounts,
    priority_counts: priorityCounts,
  };
};