import { Router, type IRouter } from "express";
import {
  GetDashboardSummaryResponse,
  GetFacilitiesQueryParams,
  GetFacilitiesResponse,
  GetPriorityResponse,
  GetRelocationParams,
  GetRelocationResponse,
  GetVillageParams,
  GetVillageResponse,
  GetVillagesQueryParams,
  GetVillagesResponse,
  GetZonesResponse,
} from "@workspace/api-zod";
import {
  getDashboardSummary,
  getRelocationRecommendations,
  getVillageDetail,
  getZoneMarkers,
  getPriorityVillages,
  listFacilities,
  listVillages,
} from "../lib/pixelalchemy";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const summary = await getDashboardSummary();
  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/zones", async (_req, res): Promise<void> => {
  const markers = await getZoneMarkers();
  res.json(GetZonesResponse.parse(markers));
});

router.get("/villages", async (req, res): Promise<void> => {
  const parsed = GetVillagesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const villages = await listVillages(parsed.data);
  res.json(GetVillagesResponse.parse(villages));
});

router.get("/villages/:villageId", async (req, res): Promise<void> => {
  const parsed = GetVillageParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const village = await getVillageDetail(parsed.data.villageId);
  if (!village) {
    res.status(404).json({ error: "Village not found" });
    return;
  }
  res.json(GetVillageResponse.parse(village));
});

router.get("/priority", async (_req, res): Promise<void> => {
  const villages = await getPriorityVillages();
  res.json(GetPriorityResponse.parse(villages));
});

router.get("/relocation/:villageId", async (req, res): Promise<void> => {
  const parsed = GetRelocationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const relocation = await getRelocationRecommendations(parsed.data.villageId);
  if (!relocation) {
    res.status(404).json({ error: "Village not found" });
    return;
  }
  res.json(GetRelocationResponse.parse(relocation));
});

router.get("/facilities", async (req, res): Promise<void> => {
  const parsed = GetFacilitiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const facilities = await listFacilities(parsed.data.type);
  res.json(GetFacilitiesResponse.parse(facilities));
});

export default router;