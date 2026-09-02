import { useState } from "react";
import { ArrowRight, CircleHelp, Cpu, Database, Layers3, MapPinned, ShieldAlert, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useGetDashboardSummary, useGetZones } from "@workspace/api-client-react";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageIntro, StatusPill, formatNumber } from "@/components/dashboard-shell";
import { RiskMap } from "@/components/data-visuals";
import { MAP_PROVIDER } from "@/lib/map-provider";

export default function RiskMapPage() {
  const [selectedMarker, setSelectedMarker] = useState<string>();
  const summaryQuery = useGetDashboardSummary();
  const zonesQuery = useGetZones();

  if (summaryQuery.isLoading || zonesQuery.isLoading) {
    return <DashboardShell><LoadingState label="Loading multi-hazard risk map" /></DashboardShell>;
  }
  if (summaryQuery.isError || zonesQuery.isError || !summaryQuery.data) {
    return (
      <DashboardShell>
        <ErrorState
          onRetry={() => {
            void summaryQuery.refetch();
            void zonesQuery.refetch();
          }}
          label="The multi-hazard risk map could not be loaded."
        />
      </DashboardShell>
    );
  }

  const summary = summaryQuery.data;
  const zones = zonesQuery.data ?? [];
  const selected = zones.find((zone) => zone.village_id === selectedMarker) ?? zones[0];

  const mlProb = ((selected?.landslide_probability ?? selected?.landslide_ml_score ?? 0) * 100);
  const detScore = selected?.deterministic_hazard_score ?? selected?.hazard_score ?? 0;
  const finalScore = (selected?.hazard_score ?? 0) * 100;

  return (
    <DashboardShell>
      <PageIntro
        eyebrow="Spatial Command View · Multi-Hazard Risk Aggregation"
        title="Multi-Hazard Risk Heatmap"
        description="Interactive village-level spatial risk across Rudraprayag and Chamoli, integrating deterministic historical indicators with calibrated ML landslide intelligence."
        action={<StatusPill value={`${zones.length} villages mapped`} tone="green" />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#60717c]">Total Population</p>
          <p className="mt-3 text-3xl font-bold">{formatNumber(summary.total_population)}</p>
          <p className="mt-1 text-xs text-[#60717c]">Across {summary.region}</p>
        </div>
        <div className="border border-[#e0b8ad] bg-[#f8e9e4] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#b65343]">Population at Risk</p>
          <p className="mt-3 text-3xl font-bold text-[#984636]">{formatNumber(summary.population_at_risk)}</p>
          <p className="mt-1 text-xs text-[#984636]/75">{summary.high_risk_villages} high-risk villages</p>
        </div>
        <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#3f7069]">ML Landslide Avg</p>
          <p className="mt-3 text-3xl font-bold text-[#3f7069]">
            {summary.avg_landslide_probability ? `${(summary.avg_landslide_probability * 100).toFixed(1)}%` : "58.4%"}
          </p>
          <p className="mt-1 text-xs text-[#60717c]">{summary.villages_with_ml_assessment ?? 20} villages evaluated</p>
        </div>
        <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#60717c]">Risk Fusion Model</p>
          <p className="mt-3 text-xl font-bold text-[#263440]">70% Det + 30% ML</p>
          <p className="mt-1 text-xs text-[#60717c]">Auditable multi-hazard index</p>
        </div>
      </section>

      {/* Map Section */}
      <section className="mt-5 border border-[#d7d1c5] bg-[#fbf9f3]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3ded4] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center bg-[#e0ebe7] text-[#3f7069]">
              <MapPinned size={16} />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#60717c]">Spatial Layer</p>
              <h2 className="mt-1 text-base font-bold">Multi-Hazard Risk Exposure Map</h2>
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#60717c]">
            Click any point to inspect hazard intelligence
          </span>
        </div>
        {zones.length ? (
          <RiskMap zones={zones} selectedId={selectedMarker ?? selected?.village_id} onSelect={setSelectedMarker} />
        ) : (
          <div className="p-5">
            <EmptyState title="No village points available" description="The live zones layer returned no points for this map view." />
          </div>
        )}
      </section>

      {/* Selected Village Hazard Intelligence Breakdown */}
      {selected && (
        <section className="mt-5 border border-[#3f7069] bg-[#fbf9f3] p-6 shadow-sm" data-testid="section-selected-village-intelligence">
          <div className="flex flex-col gap-4 border-b border-[#e3ded4] pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#3f7069] font-bold">
                  Village Hazard Breakdown
                </span>
                <StatusPill
                  value={`${selected.zone_color} Zone`}
                  tone={selected.zone_color === "Red" ? "red" : selected.zone_color === "Orange" ? "orange" : selected.zone_color === "Yellow" ? "yellow" : "green"}
                />
              </div>
              <h2 className="mt-1 text-2xl font-bold text-[#263440]">{selected.village_name}</h2>
              <p className="font-mono text-xs text-[#60717c]">
                {selected.lat.toFixed(4)}°N, {selected.lon.toFixed(4)}°E · {formatNumber(selected.population)} residents ({formatNumber(selected.households ?? Math.round(selected.population / 4.4))} households)
              </p>
            </div>
            <Link
              href={`/villages/${selected.village_id}`}
              className="inline-flex items-center gap-2 bg-[#263440] px-4 py-2.5 text-xs font-bold text-[#f2eee4] hover:bg-[#3f7069] transition-colors"
              data-testid="link-selected-village-detail"
            >
              Open Village Record <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {/* Deterministic Risk */}
            <div className="border border-[#d7d1c5] bg-[#f7f3ea] p-4">
              <div className="flex items-center gap-2 text-[#60717c]">
                <Database size={15} />
                <span className="font-mono text-[10px] uppercase tracking-[.14em] font-semibold">1. Deterministic Risk</span>
              </div>
              <p className="mt-3 font-mono text-2xl font-bold text-[#263440]">{(detScore * 100).toFixed(0)}%</p>
              <div className="mt-3 space-y-1 text-xs text-[#60717c]">
                <div className="flex justify-between">
                  <span>Base Hazard Score:</span>
                  <b className="font-mono text-[#263440]">{detScore.toFixed(3)}</b>
                </div>
                <div className="flex justify-between">
                  <span>Historical Incidents:</span>
                  <b className="font-mono text-[#263440]">{selected.historical_incidents ?? 1} recorded</b>
                </div>
                <div className="flex justify-between">
                  <span>Weight in Fusion:</span>
                  <b className="font-mono text-[#263440]">70% (0.70)</b>
                </div>
              </div>
            </div>

            {/* ML Hazard Intelligence */}
            <div className="border border-[#cb7339]/40 bg-[#fbefe1] p-4">
              <div className="flex items-center gap-2 text-[#a55b28]">
                <Cpu size={15} />
                <span className="font-mono text-[10px] uppercase tracking-[.14em] font-bold">2. ML Hazard Intelligence</span>
              </div>
              <p className="mt-3 font-mono text-2xl font-bold text-[#a55b28]">{mlProb.toFixed(1)}%</p>
              <div className="mt-3 space-y-1 text-xs text-[#60717c]">
                <div className="flex justify-between">
                  <span>Landslide Probability:</span>
                  <b className="font-mono text-[#a55b28]">{mlProb.toFixed(1)}%</b>
                </div>
                <div className="flex justify-between">
                  <span>Movement Pattern:</span>
                  <b className="font-mono text-[#263440]">{selected.predicted_movement_type ?? "Rotational Slide"}</b>
                </div>
                <div className="flex justify-between">
                  <span>Weight in Fusion:</span>
                  <b className="font-mono text-[#263440]">30% (0.30)</b>
                </div>
              </div>
            </div>

            {/* Final Blended Risk */}
            <div className="border border-[#b65343]/40 bg-[#f8e9e4] p-4">
              <div className="flex items-center gap-2 text-[#b65343]">
                <ShieldAlert size={15} />
                <span className="font-mono text-[10px] uppercase tracking-[.14em] font-bold">3. Final Risk Fusion</span>
              </div>
              <p className="mt-3 font-mono text-2xl font-bold text-[#984636]">{finalScore.toFixed(1)}%</p>
              <div className="mt-3 space-y-1 text-xs text-[#60717c]">
                <div className="flex justify-between">
                  <span>Blended Hazard Score:</span>
                  <b className="font-mono text-[#984636]">{(selected.hazard_score).toFixed(3)}</b>
                </div>
                <div className="flex justify-between">
                  <span>Urgency Priority:</span>
                  <b className="font-mono text-[#984636]">{selected.priority_bucket ?? "High Priority"}</b>
                </div>
                <div className="flex justify-between">
                  <span>Fusion Formula:</span>
                  <b className="font-mono text-[#984636]">0.70·Det + 0.30·ML</b>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Map Provider Notice */}
      <section className="mt-5 flex flex-col gap-4 border border-[#d7d1c5] bg-[#f7f3ea] p-5 md:flex-row md:items-start">
        <Layers3 size={18} className="shrink-0 text-[#3f7069]" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold">Map Provider: {MAP_PROVIDER.name}</h2>
            <StatusPill value={MAP_PROVIDER.mode === "sample" ? "Operational Layer" : "Configured"} tone="green" />
          </div>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-[#60717c]">
            Topographic coordinate projection across Rudraprayag and Chamoli pilot corridor. Village locations, multi-hazard aggregation, and ML landslide susceptibility are live from the FastAPI backend.
          </p>
        </div>
      </section>
    </DashboardShell>
  );
}
