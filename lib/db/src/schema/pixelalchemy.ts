import { createInsertSchema } from "drizzle-zod";
import {
  doublePrecision,
  integer,
  pgTable,
  text,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const villagesTable = pgTable("villages", {
  villageId: text("village_id").primaryKey(),
  villageName: text("village_name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  population: integer("population").notNull(),
  households: integer("households").notNull(),
  existingHazardZone: text("existing_hazard_zone").notNull(),
  historicalIncidents: integer("historical_incidents").notNull().default(0),
});

export const facilitiesTable = pgTable("facilities", {
  facilityId: text("facility_id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
});

export const candidateSitesTable = pgTable("candidate_sites", {
  siteId: text("site_id").primaryKey(),
  siteName: text("site_name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  landAvailability: text("land_availability").notNull(),
  existingPopulation: integer("existing_population").notNull(),
  hazardZone: text("hazard_zone").notNull(),
  distanceToRoadKm: doublePrecision("distance_to_road_km").notNull(),
  distanceToWaterKm: doublePrecision("distance_to_water_km").notNull(),
  distanceToHealthcareKm: doublePrecision("distance_to_healthcare_km").notNull(),
});

export const insertVillageSchema = createInsertSchema(villagesTable);
export const insertFacilitySchema = createInsertSchema(facilitiesTable);
export const insertCandidateSiteSchema = createInsertSchema(candidateSitesTable);

export type InsertVillage = z.infer<typeof insertVillageSchema>;
export type Village = typeof villagesTable.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Facility = typeof facilitiesTable.$inferSelect;
export type InsertCandidateSite = z.infer<typeof insertCandidateSiteSchema>;
export type CandidateSite = typeof candidateSitesTable.$inferSelect;