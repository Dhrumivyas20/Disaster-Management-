import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "@workspace/db";
import {
  candidateSitesTable,
  facilitiesTable,
  villagesTable,
} from "@workspace/db";
import { logger } from "./logger";

const dataPath = (fileName: string) =>
  resolve(process.cwd(), "../../data", fileName);

const parseCsv = (fileName: string) => {
  const lines = readFileSync(dataPath(fileName), "utf8")
    .trim()
    .split(/\r?\n/);
  const headers = lines.shift()?.split(",") ?? [];
  return lines.map((line) => {
    const values = line.split(",");
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
};

export const ensureSeeded = async () => {
  const existing = await db.select({ villageId: villagesTable.villageId }).from(villagesTable).limit(1);
  if (existing.length > 0) return;

  const villages = parseCsv("villages.csv").map((row) => ({
    villageId: row.village_id,
    villageName: row.village_name,
    lat: Number(row.lat),
    lon: Number(row.lon),
    population: Number(row.population),
    households: Number(row.households),
    existingHazardZone: row.existing_hazard_zone,
    historicalIncidents: Number(row.historical_incidents),
  }));
  const facilities = parseCsv("facilities.csv").map((row) => ({
    facilityId: row.facility_id,
    name: row.name,
    type: row.type,
    lat: Number(row.lat),
    lon: Number(row.lon),
  }));
  const candidateSites = parseCsv("candidate_sites.csv").map((row) => ({
    siteId: row.site_id,
    siteName: row.site_name,
    lat: Number(row.lat),
    lon: Number(row.lon),
    landAvailability: row.land_availability,
    existingPopulation: Number(row.existing_population),
    hazardZone: row.hazard_zone,
    distanceToRoadKm: Number(row.distance_to_road_km),
    distanceToWaterKm: Number(row.distance_to_water_km),
    distanceToHealthcareKm: Number(row.distance_to_healthcare_km),
  }));

  await db.insert(villagesTable).values(villages).onConflictDoNothing();
  await db.insert(facilitiesTable).values(facilities).onConflictDoNothing();
  await db.insert(candidateSitesTable).values(candidateSites).onConflictDoNothing();
  logger.info(
    {
      villages: villages.length,
      facilities: facilities.length,
      candidateSites: candidateSites.length,
    },
    "Seeded PixelAlchemy demo data",
  );
};