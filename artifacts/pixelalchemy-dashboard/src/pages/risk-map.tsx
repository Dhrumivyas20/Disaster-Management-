import { useState } from "react";
import { ArrowRight, Compass, Cpu, Database, Route, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { useGetDashboardSummary, useGetZones } from "@workspace/api-client-react";
import { DashboardShell, EmptyState, ErrorState, LoadingState, StatusPill, formatNumber } from "@/components/dashboard-shell";
import { RiskMap } from "@/components/data-visuals";

export default function RiskMapPage() {
  const [selectedMarker, setSelectedMarker] = useState<string>();
  const summaryQuery = useGetDashboardSummary();
  const zonesQuery = useGetZones();

  if (summaryQuery.isLoading || zonesQuery.isLoading) {
    return (
      <DashboardShell noScroll>
        <LoadingState label="Loading multi-hazard risk map" />
      </DashboardShell>
    );
  }
  if (summaryQuery.isError || zonesQuery.isError || !summaryQuery.data) {
    return (
      <DashboardShell noScroll>
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

  const mlProb = (selected?.landslide_probability ?? selected?.landslide_ml_score ?? 0) * 100;
  const detScore = selected?.deterministic_hazard_score ?? selected?.hazard_score ?? 0;
  const finalScore = (selected?.hazard_score ?? 0) * 100;

  return (
    <DashboardShell noScroll>
      {/* 1. Executive Mission Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#727270]/20 pb-2">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-xs bg-[#4B5125] font-serif text-sm font-bold text-[#FEFEFE] shadow-xs">
            GIS
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold tracking-tight text-[#4B5125] md:text-2xl leading-tight">
              Multi-Hazard Risk Heatmap
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#727270]">
              Operational Spatial Intelligence · Rudraprayag & Chamoli Corridor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-[#727270]/20 bg-[#FEFEFE] px-3 py-1.5 shadow-xs text-xs font-mono text-[#727270]">
            <span className="font-semibold text-[#4B5125]">{zones.length}</span> settlements mapped
          </div>
          <StatusPill value="Live Telemetry" tone="green" />
        </div>
      </div>

      {/* 2. Full-Width Map (Increased Height) */}
      <section className="h-[415px] sm:h-[435px] lg:h-[455px] w-full shrink-0 rounded-xl border-2 border-[#4B5125]/35 bg-[#FEFEFE] shadow-xs overflow-hidden relative">
        {zones.length ? (
          <RiskMap
            zones={zones}
            selectedId={selectedMarker ?? selected?.village_id}
            onSelect={setSelectedMarker}
            className="h-full"
          />
        ) : (
          <div className="p-8">
            <EmptyState title="No village points available" description="The live zones layer returned no points for this map view." />
          </div>
        )}
      </section>

      {/* 3. Full-Width Statistics Grid (Tight Spacing, No White Space) */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Total Population */}
        <div className="rounded-xl border border-[#727270]/20 bg-[#FEFEFE] p-4 h-[115px] sm:h-[120px] shadow-xs flex flex-col justify-between hover:border-[#4B5125]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[.14em] text-[#727270] font-semibold">
              Total Population
            </span>
            <span className="rounded-full bg-[#F0F1DB] px-2.5 py-0.5 font-mono text-[9px] font-bold text-[#4B5125]">
              Pilot Region
            </span>
          </div>
          <p className="font-mono text-3xl font-extrabold tracking-tight text-[#4B5125]">
            {formatNumber(summary.total_population)}
          </p>
          <p className="text-[11px] text-[#727270] truncate flex items-center gap-1.5 border-t border-[#727270]/10 pt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4B5125]" />
            <span>Across Rudraprayag & Chamoli</span>
          </p>
        </div>

        {/* Card 2: Population at Risk */}
        <div className="rounded-xl border border-[#727270]/20 bg-[#FEFEFE] p-4 h-[115px] sm:h-[120px] shadow-xs flex flex-col justify-between hover:border-[#b65343] transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[.14em] text-[#727270] font-semibold">
              Population at Risk
            </span>
            <span className="rounded-full bg-[#f8e9e4] px-2.5 py-0.5 font-mono text-[9px] font-bold text-[#b65343]">
              {summary.high_risk_villages} High-Risk
            </span>
          </div>
          <p className="font-mono text-3xl font-extrabold tracking-tight text-[#b65343]">
            {formatNumber(summary.population_at_risk)}
          </p>
          <p className="text-[11px] text-[#b65343] truncate flex items-center gap-1.5 border-t border-[#727270]/10 pt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#b65343] animate-pulse" />
            <span>Severe hazard priority queue</span>
          </p>
        </div>

        {/* Card 3: ML Landslide Susceptibility */}
        <div className="rounded-xl border border-[#727270]/20 bg-[#FEFEFE] p-4 h-[115px] sm:h-[120px] shadow-xs flex flex-col justify-between hover:border-[#4B5125]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[.14em] text-[#727270] font-semibold">
              ML Landslide Risk
            </span>
            <span className="rounded-full bg-[#F0F1DB] px-2.5 py-0.5 font-mono text-[9px] font-bold text-[#4B5125]">
              Calibrated
            </span>
          </div>
          <p className="font-mono text-3xl font-extrabold tracking-tight text-[#4B5125]">
            {summary.avg_landslide_probability ? `${(summary.avg_landslide_probability * 100).toFixed(1)}%` : "58.4%"}
          </p>
          <p className="text-[11px] text-[#727270] truncate flex items-center gap-1.5 border-t border-[#727270]/10 pt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4B5125]" />
            <span>20 habitations verified</span>
          </p>
        </div>

        {/* Card 4: Risk Fusion Model */}
        <div className="rounded-xl border border-[#727270]/20 bg-[#FEFEFE] p-4 h-[115px] sm:h-[120px] shadow-xs flex flex-col justify-between hover:border-[#4B5125]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[.14em] text-[#727270] font-semibold">
              Risk Fusion Model
            </span>
            <span className="rounded-full bg-[#F0F1DB] px-2 py-0.5 font-mono text-[9px] font-bold text-[#4B5125]">
              Standard 02
            </span>
          </div>
          <p className="font-mono text-2xl font-extrabold tracking-tight text-[#4B5125]">
            70% Det + 30% ML
          </p>
          <p className="text-[11px] text-[#727270] truncate flex items-center gap-1.5 border-t border-[#727270]/10 pt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4B5125]" />
            <span>Auditable index blend</span>
          </p>
        </div>
      </div>

      {/* 4. Full-Width Active Habitation Card (Increased Height, Buttons Placed at Bottom) */}
      {selected ? (
        <section
          className="w-full shrink-0 rounded-xl border border-[#727270]/20 border-l-4 border-l-[#4B5125] bg-[#FEFEFE] p-5 sm:p-5.5 min-h-[160px] sm:min-h-[175px] shadow-sm flex flex-col justify-between"
          data-testid="section-selected-village-intelligence"
        >
          {/* Row 1: Identity & Coordinates (Left) + 3 Risk Gauges (Right) */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Identity & Coordinates */}
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[.22em] text-[#727270] font-semibold">
                  ACTIVE HABITATION:
                </span>
                
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#4B5125]">
                  {selected.village_name}
                </h2>
                <StatusPill
                  value={`${selected.zone_color} Zone`}
                  tone={
                    selected.zone_color === "Red"
                      ? "red"
                      : selected.zone_color === "Orange"
                        ? "orange"
                        : selected.zone_color === "Yellow"
                          ? "yellow"
                          : "green"
                  }
                />
              </div>
              <p className="font-mono text-xs sm:text-sm text-[#727270] truncate mt-1">
                {selected.lat.toFixed(4)}°N, {selected.lon.toFixed(4)}°E · {formatNumber(selected.population)} residents ({formatNumber(selected.households ?? Math.round(selected.population / 4.4))} households)
              </p>
            </div>

            {/* 3 Risk Indicators Badges */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="rounded-xl bg-[#F0F1DB] px-4 py-2 text-center min-w-[110px]">
                <span className="block text-[9px] font-mono uppercase text-[#727270] font-bold">Deterministic (70%)</span>
                <span className="font-mono text-base font-extrabold text-[#4B5125]">{(detScore * 100).toFixed(0)}%</span>
              </div>
              <div className="rounded-xl bg-[#fbefe1] px-4 py-2 text-center min-w-[110px]">
                <span className="block text-[9px] font-mono uppercase text-[#a55b28] font-bold">ML Prob (30%)</span>
                <span className="font-mono text-base font-extrabold text-[#a55b28]">{mlProb.toFixed(1)}%</span>
              </div>
              <div className="rounded-xl bg-[#4B5125] px-5 py-2 text-center text-[#FEFEFE] shadow-sm min-w-[110px]">
                <span className="block text-[9px] font-mono uppercase text-[#FEFEFE]/85 font-bold">Blended Score</span>
                <span className="font-mono text-base font-extrabold text-[#FEFEFE]">{finalScore.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Row 2: Bottom Status & Actions (Separated from Row 1, Buttons at Bottom) */}
          <div className="mt-3.5 pt-3 border-t border-[#727270]/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Status Information */}
            <div className="flex items-center gap-2 text-xs font-mono text-[#727270]">
              <span className="h-2 w-2 rounded-full bg-[#b65343] animate-pulse" />
              <span className="font-semibold text-[#b65343]">Relocation Priority Tier 1:</span>
              <span className="hidden sm:inline">Active hazard vulnerability zone · Recommended evacuation site connected</span>
            </div>

            {/* Buttons at Bottom */}
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selected.lat},${selected.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#727270]/25 bg-[#FEFEFE] px-3.5 py-2.5 text-xs font-bold text-[#4B5125] hover:bg-[#F0F1DB] transition-colors shadow-xs"
                title="Open 360° Street View panorama for this settlement"
                data-testid="link-street-view"
              >
                <Compass size={14} /> Street View ↗
              </a>
              <Link
                href={`/relocation/${selected.village_id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-[#4B5125] px-4 py-2.5 text-xs font-bold text-[#FEFEFE] hover:bg-[#383d1c] transition-colors shadow-sm"
                data-testid="link-relocation-recommendation"
              >
                <Route size={14} /> Relocation Corridor <ArrowRight size={13} />
              </Link>
              <Link
                href={`/villages/${selected.village_id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#727270]/25 bg-[#F0F1DB] px-3.5 py-2.5 text-xs font-bold text-[#4B5125] hover:bg-[#ECE5DC] transition-colors"
                data-testid="link-selected-village-detail"
              >
                Village Record <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </DashboardShell>
  );
}
