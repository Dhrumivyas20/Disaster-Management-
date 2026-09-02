import { useMemo } from "react";
import { AlertTriangle, ArrowRight, BarChart3, Cpu, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useGetDashboardSummary, useGetVillages } from "@workspace/api-client-react";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageIntro, StatusPill, formatNumber } from "@/components/dashboard-shell";

const zones = ["Red", "Orange", "Yellow", "Green"];
const zoneColor: Record<string, string> = { Red: "#b65343", Orange: "#cb7339", Yellow: "#d5a938", Green: "#4c806d" };

export default function HazardAnalysis() {
  const summaryQuery = useGetDashboardSummary();
  const villagesQuery = useGetVillages();
  const villages = useMemo(() => villagesQuery.data ?? [], [villagesQuery.data]);

  const zoneStats = useMemo(
    () =>
      zones.map((zone) => {
        const inZone = villages.filter((village) => village.zone_color === zone);
        const average = inZone.length ? inZone.reduce((total, village) => total + village.hazard_score, 0) / inZone.length : 0;
        return { zone, count: inZone.length, average };
      }),
    [villages]
  );
  const highest = useMemo(
    () => [...villages].sort((a, b) => b.hazard_score - a.hazard_score).slice(0, 6),
    [villages]
  );

  if (summaryQuery.isLoading || villagesQuery.isLoading) {
    return <DashboardShell><LoadingState label="Calculating multi-hazard risk analysis" /></DashboardShell>;
  }
  if (summaryQuery.isError || villagesQuery.isError || !summaryQuery.data) {
    return (
      <DashboardShell>
        <ErrorState
          onRetry={() => {
            void summaryQuery.refetch();
            void villagesQuery.refetch();
          }}
          label="Hazard analysis could not be loaded."
        />
      </DashboardShell>
    );
  }

  const summary = summaryQuery.data;

  return (
    <DashboardShell>
      <PageIntro
        eyebrow="Analysis Desk · Multi-Hazard & ML Fusion"
        title="Hazard Analysis"
        description="Compare zone distribution with calibrated village scores. Multi-hazard risk is derived from 70% deterministic indicators and 30% ML landslide susceptibility."
        action={<StatusPill value="Risk Fusion 70/30" tone="green" />}
      />

      <section className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
        <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#60717c]">Zone Distribution</p>
              <h2 className="mt-1 text-lg font-bold">Villages by Hazard Band</h2>
            </div>
            <BarChart3 size={18} className="text-[#3f7069]" />
          </div>
          <div className="mt-7 space-y-5">
            {zoneStats.map(({ zone, count, average }) => (
              <div key={zone}>
                <div className="mb-2 flex items-end justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: zoneColor[zone] }} />
                    {zone} Zone
                  </span>
                  <span className="font-mono text-xs text-[#60717c]">
                    {count} villages · {(average * 100).toFixed(1)}% avg score
                  </span>
                </div>
                <div className="h-3 bg-[#e2ded3]">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${summary.total_villages ? (count / summary.total_villages) * 100 : 0}%`, background: zoneColor[zone] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#b65343]">Exposure Signal</p>
              <h2 className="mt-1 text-lg font-bold">Highest Hazard Scores</h2>
            </div>
            <AlertTriangle size={18} className="text-[#b65343]" />
          </div>
          {highest.length ? (
            <div className="mt-4 divide-y divide-[#e3ded4]">
              {highest.map((village, index) => {
                const mlProb = (village.landslide_probability ?? village.landslide_ml_score ?? 0) * 100;
                return (
                  <Link
                    href={`/villages/${village.village_id}`}
                    key={village.village_id}
                    className="group flex items-center gap-3 py-3"
                    data-testid={`link-hazard-village-${village.village_id}`}
                  >
                    <span className="w-5 font-mono text-[10px] text-[#8a989a]">0{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold group-hover:text-[#b65343]">
                        {village.village_name}
                      </span>
                      <span className="text-xs text-[#60717c]">
                        {village.existing_hazard_zone} baseline · ML: {mlProb.toFixed(0)}% · {formatNumber(village.population)} people
                      </span>
                    </span>
                    <span className="font-mono text-sm font-bold text-[#263440]">
                      {(village.hazard_score * 100).toFixed(1)}%
                    </span>
                    <ArrowRight size={14} className="text-[#8a989a] group-hover:text-[#b65343]" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No village scores available" description="The village layer returned no records for this analysis." />
          )}
        </div>
      </section>

      <section className="mt-5 border border-[#d7d1c5] bg-[#263440] p-6 text-[#f2eee4]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#aeb8b6]">Multi-Hazard Methodology</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d6ddda]">
              Final hazard scores combine historical disaster exposure (70%) with ML landslide probability (30%). Population pressure and household exposure are factored in to rank actionable relocation priorities.
            </p>
          </div>
          <Link
            href="/relocation-priority"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#f7d884] hover:text-[#e8b84c]"
            data-testid="link-hazard-priority"
          >
            View Urgency Queue <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </DashboardShell>
  );
}
