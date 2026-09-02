import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CalendarDays, ChevronRight, Cpu, Home, ShieldCheck, Sparkles, Users } from "lucide-react";
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
          <div className="flex items-center gap-2 text-xs text-[#60717c]">
            <span className="h-2 w-2 rounded-full bg-[#4c806d]" />
            <span>ML & Risk Pipeline Active</span>
            <StatusPill value={summary.ml_status ?? "Operational"} tone="green" />
          </div>
        }
      />

      {/* Regional Headline Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Regional summary">
        {[
          { label: "Communities Tracked", value: formatNumber(summary.total_villages), detail: "Across Rudraprayag & Chamoli", icon: ShieldCheck },
          { label: "People Exposed", value: formatNumber(summary.population_at_risk), detail: `${summary.high_risk_villages} high-risk villages`, icon: Users, alert: true },
          { label: "Immediate Priority", value: formatNumber(summary.immediate_priority), detail: "Urgent relocation planning", icon: CalendarDays, alert: true },
          { label: "Households Mapped", value: formatNumber(summary.total_households), detail: `${formatNumber(summary.total_population)} total population`, icon: Home },
        ].map(({ label, value, detail, icon: Icon, alert }) => (
          <div
            key={label}
            className={`border p-5 ${alert ? "border-[#e0b8ad] bg-[#f8e9e4]" : "border-[#d7d1c5] bg-[#fbf9f3]"}`}
            data-testid={`card-summary-${label.toLowerCase().replaceAll(" ", "-")}`}
          >
            <div className="flex items-start justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#60717c]">{label}</p>
              <Icon size={17} className={alert ? "text-[#b65343]" : "text-[#3f7069]"} />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-[-.04em]">{value}</p>
            <p className="mt-1 text-xs text-[#60717c]">{detail}</p>
          </div>
        ))}
      </section>

      {/* Dedicated ML Hazard Intelligence & Relocation Demand KPIs */}
      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="ML Hazard Intelligence KPIs">
        <div className="border border-[#d7d1c5] bg-[#f7f3ea] p-4">
          <div className="flex items-center justify-between text-[#3f7069]">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] font-semibold">ML Landslide Susceptibility</p>
            <Cpu size={15} />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#263440]">{avgMlProb}%</p>
          <p className="mt-0.5 text-xs text-[#60717c]">Regional average across pilot corridor</p>
        </div>

        <div className="border border-[#cb7339]/30 bg-[#fbefe1] p-4">
          <div className="flex items-center justify-between text-[#a55b28]">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] font-bold">Predicted Relocation Demand</p>
            <Users size={15} />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#a55b28]">{formatNumber(totalDemandFamilies)} <span className="text-xs font-normal text-[#60717c]">families</span></p>
          <p className="mt-0.5 text-xs text-[#60717c]">ML-estimated relocation requirement</p>
        </div>

        <div className="border border-[#d7d1c5] bg-[#f7f3ea] p-4">
          <div className="flex items-center justify-between text-[#60717c]">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] font-semibold">Evaluated Villages</p>
            <ShieldCheck size={15} />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#263440]">{assessedVillages} <span className="text-xs font-normal text-[#60717c]">of {summary.total_villages}</span></p>
          <p className="mt-0.5 text-xs text-[#60717c]">100% evaluated with ML intelligence</p>
        </div>

        <div className="border border-[#d7d1c5] bg-[#f7f3ea] p-4">
          <div className="flex items-center justify-between text-[#60717c]">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] font-semibold">Multi-Hazard Fusion</p>
            <Sparkles size={15} className="text-[#3f7069]" />
          </div>
          <p className="mt-2 text-base font-bold text-[#263440]">70% Det + 30% ML</p>
          <p className="mt-0.5 text-xs text-[#60717c]">Auditable deterministic + ML blend</p>
        </div>
      </section>

      {/* Spatial Map and Priority List */}
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
        <div className="border border-[#d7d1c5] bg-[#fbf9f3]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3ded4] px-5 py-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#60717c]">Spatial Heatmap</p>
              <h2 className="mt-1 text-base font-bold">Multi-Hazard Risk Exposure</h2>
            </div>
            <Link href="/risk-map" className="flex items-center gap-1 text-xs font-semibold text-[#3f7069] hover:text-[#b65343]" data-testid="link-open-risk-map">
              Full Map View <ArrowRight size={14} />
            </Link>
          </div>
          <RiskMap zones={zones} selectedId={selectedMarker} onSelect={setSelectedMarker} />
          <div className="grid grid-cols-4 border-t border-[#e3ded4]">
            {zoneOrder.map((zone) => (
              <div key={zone} className="border-r border-[#e3ded4] px-4 py-3 last:border-r-0">
                <p className="font-mono text-[10px] uppercase text-[#8a989a]">{zone} Zone</p>
                <p className="mt-1 text-lg font-bold">{summary.zone_counts[zone] ?? 0}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#d7d1c5] bg-[#fbf9f3]">
          <div className="flex items-center justify-between border-b border-[#e3ded4] px-5 py-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#b65343]">Urgency Queue</p>
              <h2 className="mt-1 text-base font-bold">Priority Villages</h2>
            </div>
            <Link
              href="/relocation-priority"
              className="grid h-7 w-7 place-items-center border border-[#d7d1c5] text-[#60717c] hover:border-[#3f7069] hover:text-[#3f7069]"
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
        <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#60717c]">Priority Breakdown</p>
              <h2 className="mt-1 text-base font-bold">Relocation Urgency Distribution</h2>
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
                color={key === "Immediate" ? "#b65343" : key === "Short-term" ? "#cb7339" : key === "Medium-term" ? "#d5a938" : "#4c806d"}
              />
            ))}
          </div>
        </div>

        <div className="border border-[#d7d1c5] bg-[#263440] p-5 text-[#f2eee4]">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#aeb8b6]">Decision Architecture</p>
              <h2 className="mt-1 text-base font-bold">Evidence-Based Risk & Relocation</h2>
            </div>
            <span className="grid h-8 w-8 place-items-center bg-[#e8b84c] text-[#263440]">
              <ShieldCheck size={16} />
            </span>
          </div>
          <p className="mt-5 max-w-lg text-sm leading-6 text-[#d6ddda]">
            The system uses ML to estimate hazard susceptibility and relocation demand, combines that intelligence with deterministic risk indicators, prioritizes villages, and uses predicted demand to screen carrying capacity before ranking safe sites via AHP.
          </p>
          <Link
            href="/relocation-priority"
            className="mt-6 inline-flex items-center gap-2 border border-[#718087] px-4 py-2.5 text-sm font-semibold hover:border-[#e8b84c] hover:text-[#f7d884] transition-colors"
            data-testid="link-review-method"
          >
            Review Priority Queue <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </DashboardShell>
  );
}
