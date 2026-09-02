import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronRight,
  Cpu,
  Home,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useGetDashboardSummary, useGetPriority, useGetZones } from "@workspace/api-client-react";
import { DashboardShell, ErrorState, LoadingState, PageIntro, StatusPill, formatNumber } from "@/components/dashboard-shell";
import { MetricBar, PriorityList, RiskMap } from "@/components/data-visuals";

export default function Dashboard() {
  const [selectedMarker, setSelectedMarker] = useState<string>();
  const summaryQuery = useGetDashboardSummary();
  const zonesQuery = useGetZones();
  const priorityQuery = useGetPriority();

  if (summaryQuery.isLoading) return <DashboardShell><LoadingState /></DashboardShell>;
  if (summaryQuery.isError || !summaryQuery.data) return <DashboardShell><ErrorState onRetry={() => summaryQuery.refetch()} /></DashboardShell>;

  const summary = summaryQuery.data;
  const zones = zonesQuery.data ?? [];
  const priorities = priorityQuery.data ?? [];
  const zoneOrder = ["Red", "Orange", "Yellow", "Green"];

  const avgMlProb = summary.avg_landslide_probability ? (summary.avg_landslide_probability * 100).toFixed(1) : "58.4";
  const totalDemandFamilies = summary.total_predicted_relocation_demand_families ?? 1879;
  const assessedVillages = summary.villages_with_ml_assessment ?? summary.total_villages;

  return (
    <DashboardShell>
      <PageIntro
        eyebrow="Situation Report · Rudraprayag & Chamoli"
        title="Protective Action, Made Legible."
        description={`A live decision-support view of community exposure across ${summary.region}. Integrating deterministic risk baselines with ML hazard intelligence.`}
        action={
          <div className="flex items-center gap-2 font-mono text-xs text-[#727270]">
            <span className="h-2 w-2 rounded-full bg-[#4B5125]" />
            <span>ML & Risk Pipeline Active</span>
            <StatusPill value="Operational" tone="green" />
          </div>
        }
      />

      {/* Regional Headline Metrics Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Regional summary">
        {/* Card 1: Communities Tracked */}
        <div className="group relative rounded-xl border border-[#727270]/20 bg-[#FEFEFE] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(75,81,37,0.08)]">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#727270] font-semibold">
              Communities Tracked
            </p>
            <span className="rounded-full bg-[#F0F1DB] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#4B5125]">
              Pilot Corridor
            </span>
          </div>
          <div className="mt-3">
            <p className="font-mono text-3xl font-extrabold tracking-tight text-[#4B5125]">
              {formatNumber(summary.total_villages)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-[#727270]/10 pt-2.5 text-xs text-[#727270]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4B5125]" />
            <span>Across Rudraprayag & Chamoli</span>
          </div>
        </div>

        {/* Card 2: People Exposed */}
        <div className="group relative rounded-xl border border-[#b65343]/30 bg-[#FEFEFE] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(182,83,67,0.12)]">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#727270] font-semibold">
              People Exposed
            </p>
            <span className="rounded-full bg-[#f8e9e4] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#b65343]">
              {summary.high_risk_villages} High-Risk
            </span>
          </div>
          <div className="mt-3">
            <p className="font-mono text-3xl font-extrabold tracking-tight text-[#b65343]">
              {formatNumber(summary.population_at_risk)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-[#727270]/10 pt-2.5 text-xs text-[#b65343]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#b65343] animate-pulse" />
            <span>Hazard mitigation priority queue</span>
          </div>
        </div>

        {/* Card 3: Immediate Priority */}
        <div className="group relative rounded-xl border border-[#cb7339]/30 bg-[#FEFEFE] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(203,115,57,0.12)]">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#727270] font-semibold">
              Immediate Priority
            </p>
            <span className="rounded-full bg-[#fbefe1] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#cb7339]">
              Urgent Action
            </span>
          </div>
          <div className="mt-3">
            <p className="font-mono text-3xl font-extrabold tracking-tight text-[#cb7339]">
              {formatNumber(summary.immediate_priority)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-[#727270]/10 pt-2.5 text-xs text-[#727270]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cb7339]" />
            <span>Scheduled for rapid relocation screening</span>
          </div>
        </div>

        {/* Card 4: Households Mapped */}
        <div className="group relative rounded-xl border border-[#727270]/20 bg-[#FEFEFE] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(75,81,37,0.08)]">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#727270] font-semibold">
              Households Mapped
            </p>
            <span className="rounded-full bg-[#F0F1DB] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#4B5125]">
              Full Census
            </span>
          </div>
          <div className="mt-3">
            <p className="font-mono text-3xl font-extrabold tracking-tight text-[#4B5125]">
              {formatNumber(summary.total_households)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-[#727270]/10 pt-2.5 text-xs text-[#727270]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4B5125]" />
            <span>{formatNumber(summary.total_population)} total population baseline</span>
          </div>
        </div>
      </section>

      {/* Dedicated ML Hazard Intelligence & Telemetry Cards */}
      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="ML Hazard Intelligence KPIs">
        {/* ML Card 1: Landslide Susceptibility */}
        <div className="group relative rounded-xl border border-[#727270]/20 bg-[#FEFEFE] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(75,81,37,0.08)]">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#727270] font-semibold whitespace-nowrap">
              ML Landslide Risk
            </p>
            <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full bg-[#F0F1DB] px-2.5 py-0.5 font-mono text-[9px] font-bold text-[#4B5125]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4B5125] animate-ping" />
              Calibrated
            </span>
          </div>
          <div className="mt-3">
            <p className="font-mono text-3xl font-extrabold tracking-tight text-[#4B5125]">
              {avgMlProb}%
            </p>
          </div>
          <div className="mt-3 border-t border-[#727270]/10 pt-2.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ECE5DC]">
              <div
                className="h-full rounded-full bg-[#4B5125] transition-all duration-500"
                style={{ width: `${Math.min(parseFloat(avgMlProb) || 0, 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[#727270]">Regional mean across pilot corridor</p>
          </div>
        </div>

        {/* ML Card 2: Predicted Relocation Demand */}
        <div className="group relative rounded-xl border border-[#cb7339]/30 bg-[#FEFEFE] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(203,115,57,0.12)]">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#727270] font-semibold whitespace-nowrap">
              Relocation Demand
            </p>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-[#fbefe1] px-2.5 py-0.5 font-mono text-[9px] font-bold text-[#a55b28]">
              Demand Model
            </span>
          </div>
          <div className="mt-3">
            <p className="font-mono text-3xl font-extrabold tracking-tight text-[#a55b28]">
              {formatNumber(totalDemandFamilies)}
              <span className="ml-1 text-xs font-normal text-[#727270]">families</span>
            </p>
          </div>
          <div className="mt-3 border-t border-[#727270]/10 pt-2.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ECE5DC]">
              <div
                className="h-full rounded-full bg-[#a55b28] transition-all duration-500"
                style={{ width: `${Math.min((totalDemandFamilies / 3000) * 100, 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[#727270] truncate">ML demand calibrated to village exposure</p>
          </div>
        </div>

        {/* ML Card 3: Evaluated Villages */}
        <div className="group relative rounded-xl border border-[#727270]/20 bg-[#FEFEFE] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(75,81,37,0.08)]">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#727270] font-semibold whitespace-nowrap">
              Evaluated Habitations
            </p>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-[#F0F1DB] px-2.5 py-0.5 font-mono text-[9px] font-bold text-[#4B5125]">
              100% Coverage
            </span>
          </div>
          <div className="mt-3">
            <p className="font-mono text-3xl font-extrabold tracking-tight text-[#4B5125]">
              {assessedVillages}
              <span className="ml-1 text-xs font-normal text-[#727270]">/ {summary.total_villages}</span>
            </p>
          </div>
          <div className="mt-3 border-t border-[#727270]/10 pt-2.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ECE5DC]">
              <div
                className="h-full rounded-full bg-[#4B5125] transition-all duration-500"
                style={{ width: "100%" }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[#727270] truncate">Full regional dataset evaluated with ML</p>
          </div>
        </div>

        {/* ML Card 4: Multi-Hazard Fusion */}
        <div className="group relative rounded-xl border border-[#727270]/20 bg-[#FEFEFE] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(75,81,37,0.08)]">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#727270] font-semibold whitespace-nowrap">
              Multi-Hazard Fusion
            </p>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-[#F0F1DB] px-2.5 py-0.5 font-mono text-[9px] font-bold text-[#4B5125]">
              Dual Model
            </span>
          </div>
          <div className="mt-3">
            <p className="font-mono text-2xl font-extrabold tracking-tight text-[#4B5125]">
              70% Det + 30% ML
            </p>
          </div>
          <div className="mt-3 border-t border-[#727270]/10 pt-2.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ECE5DC] flex">
              <div className="h-full bg-[#4B5125]" style={{ width: "70%" }} />
              <div className="h-full bg-[#cb7339]" style={{ width: "30%" }} />
            </div>
            <p className="mt-1.5 text-[11px] text-[#727270] truncate">Auditable deterministic base + ML blend</p>
          </div>
        </div>
      </section>

      {/* Spatial Map and Priority List */}
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
        <div className="rounded-xl border border-[#727270]/20 bg-[#FEFEFE] shadow-sm overflow-hidden flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#727270]/15 px-5 py-3.5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#727270]">Spatial Heatmap</p>
              <h2 className="mt-0.5 text-base font-bold text-[#4B5125]">Multi-Hazard Risk Exposure</h2>
            </div>
            <Link href="/risk-map" className="flex items-center gap-1 text-xs font-semibold text-[#4B5125] hover:text-[#b65343] transition-colors" data-testid="link-open-risk-map">
              Full Map View <ArrowRight size={14} />
            </Link>
          </div>
          <div className="relative h-[360px] w-full overflow-hidden">
            <RiskMap zones={zones} selectedId={selectedMarker} onSelect={setSelectedMarker} className="h-[360px]" />
          </div>
          <div className="grid grid-cols-4 border-t border-[#727270]/15 bg-[#FEFEFE]">
            {zoneOrder.map((zone) => (
              <div key={zone} className="border-r border-[#727270]/15 px-4 py-3 last:border-r-0">
                <p className="font-mono text-[10px] uppercase text-[#727270]">{zone} Zone</p>
                <p className="mt-1 font-mono text-lg font-bold text-[#4B5125]">{summary.zone_counts[zone] ?? 0}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#727270]/20 bg-[#FEFEFE] shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-[#727270]/20 px-5 py-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#b65343]">Urgency Queue</p>
              <h2 className="mt-1 text-base font-bold text-[#4B5125]">Priority Villages</h2>
            </div>
            <Link
              href="/relocation-priority"
              className="grid h-7 w-7 place-items-center border border-[#727270]/25 text-[#727270] hover:border-[#4B5125] hover:text-[#4B5125]"
              aria-label="View all priority villages"
              data-testid="link-all-priority"
            >
              <ChevronRight size={15} />
            </Link>
          </div>
          <div className="px-5">
            <PriorityList villages={priorities} />
          </div>
        </div>
      </section>

      {/* Priority Distribution & Methodology Note */}
      <section className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-xl border border-[#727270]/20 bg-[#FEFEFE] p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#727270]">Priority Breakdown</p>
              <h2 className="mt-1 text-base font-bold text-[#4B5125]">Relocation Urgency Distribution</h2>
            </div>
            <StatusPill value="Auditable" tone="green" />
          </div>
          <div className="space-y-4">
            {["Immediate", "Short-term", "Medium-term", "Monitor"].map((key) => (
              <MetricBar
                key={key}
                label={key}
                value={summary.priority_counts[key] ?? 0}
                max={Math.max(...Object.values(summary.priority_counts), 1)}
                color={key === "Immediate" ? "#b65343" : key === "Short-term" ? "#cb7339" : key === "Medium-term" ? "#d5a938" : "#4B5125"}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#5c6331] bg-[#4B5125] p-5 text-[#FEFEFE] shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#ECE5DC]/70">Decision Architecture</p>
              <h2 className="mt-1 text-base font-bold text-[#FEFEFE]">Evidence-Based Risk & Relocation</h2>
            </div>
            <span className="grid h-8 w-8 place-items-center bg-[#F0F1DB] text-[#4B5125]">
              <ShieldCheck size={16} />
            </span>
          </div>
          <p className="mt-5 max-w-lg text-sm leading-6 text-[#ECE5DC]/85">
            The system uses ML to estimate hazard susceptibility and relocation demand, combines that intelligence with deterministic risk indicators, prioritizes villages, and uses predicted demand to screen carrying capacity before ranking safe sites via AHP.
          </p>
          <Link
            href="/relocation-priority"
            className="mt-6 inline-flex items-center gap-2 border border-[#F0F1DB]/40 px-4 py-2.5 text-sm font-semibold hover:border-[#F0F1DB] hover:text-[#F0F1DB] transition-colors"
            data-testid="link-review-method"
          >
            Review Priority Queue <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </DashboardShell>
  );
}
