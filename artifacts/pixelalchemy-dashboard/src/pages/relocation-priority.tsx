import { ArrowRight, Cpu, Home, ListOrdered, Route, ShieldAlert, Sparkles, Users } from "lucide-react";
import { Link } from "wouter";
import { useGetPriority } from "@workspace/api-client-react";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageIntro, StatusPill, formatNumber } from "@/components/dashboard-shell";

const bucketTone: Record<string, "red" | "orange" | "yellow" | "green"> = {
  Immediate: "red",
  "Short-term": "orange",
  "Medium-term": "yellow",
  Monitor: "green",
};

export default function RelocationPriority() {
  const query = useGetPriority();

  if (query.isLoading) {
    return <DashboardShell><LoadingState label="Loading ranked relocation urgency queue" /></DashboardShell>;
  }
  if (query.isError) {
    return <DashboardShell><ErrorState onRetry={() => query.refetch()} label="The urgency queue could not be loaded." /></DashboardShell>;
  }

  const villages = query.data ?? [];
  const immediateCount = villages.filter((v) => v.priority_bucket === "Immediate").length;
  const shortTermCount = villages.filter((v) => v.priority_bucket === "Short-term").length;
  const totalFamiliesDemand = villages.reduce((acc, v) => acc + (v.awaiting_families_estimate ?? 0), 0);

  return (
    <DashboardShell>
      <PageIntro
        eyebrow="Action Queue · Relocation Urgency Ranking"
        title="Village Risk & Relocation Priority"
        description="Authoritative relocation queue combining deterministic multi-hazard exposure with ML landslide intelligence and estimated family relocation demand."
        action={<StatusPill value={`${villages.length} villages ranked`} tone="green" />}
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-[#e0b8ad] bg-[#f8e9e4] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#b65343]">Immediate Priority</p>
          <p className="mt-2 text-3xl font-bold text-[#984636]">{immediateCount}</p>
          <p className="mt-1 text-xs text-[#b65343]">Requires immediate site matching</p>
        </div>
        <div className="border border-[#ead0b6] bg-[#fbefe1] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#a55b28]">Short-term Priority</p>
          <p className="mt-2 text-3xl font-bold text-[#a55b28]">{shortTermCount}</p>
          <p className="mt-1 text-xs text-[#60717c]">Scheduled for district review</p>
        </div>
        <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#3f7069]">Total Relocation Demand</p>
          <p className="mt-2 text-3xl font-bold text-[#3f7069]">{formatNumber(totalFamiliesDemand)} <span className="text-sm font-normal text-[#60717c]">families</span></p>
          <p className="mt-1 text-xs text-[#60717c]">ML-estimated across region</p>
        </div>
        <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#60717c]">Priority Formula</p>
          <p className="mt-2 text-sm font-bold text-[#263440]">40% Haz + 30% Pop + 10% HH + 20% Inc</p>
          <p className="mt-1 text-xs text-[#60717c]">Authoritative deterministic weighting</p>
        </div>
      </section>

      {villages.length === 0 ? (
        <EmptyState title="The urgency queue is empty" description="No scored village records are available to rank at the moment." />
      ) : (
        <section className="border border-[#d7d1c5] bg-[#fbf9f3]">
          <div className="flex items-center justify-between border-b border-[#e3ded4] px-5 py-4">
            <div className="flex items-center gap-3">
              <ListOrdered size={18} className="text-[#b65343]" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#60717c]">Authoritative Urgency Queue</p>
                <h2 className="mt-0.5 text-base font-bold">Prioritized Decision Register</h2>
              </div>
            </div>
            <span className="font-mono text-[10px] uppercase text-[#60717c]">Ordered by Priority Score (100 Max)</span>
          </div>

          <div className="divide-y divide-[#e3ded4]">
            {villages.map((village, index) => {
              const mlProb = (village.landslide_probability ?? village.landslide_ml_score ?? 0) * 100;
              const finalRisk = (village.hazard_score * 100).toFixed(1);
              const awaitingFams = village.awaiting_families_estimate ?? Math.round(village.households * 0.15);
              const movement = village.predicted_movement_type ?? "Rotational Slide";
              const reasons = village.why_priority_reasons?.slice(0, 3) ?? [
                `${village.existing_hazard_zone} baseline hazard classification`,
                `ML landslide probability: ${mlProb.toFixed(1)}%`,
                `Estimated relocation demand: ~${awaitingFams} families`,
              ];

              return (
                <div key={village.village_id} className="p-5 hover:bg-[#f7f3ea] transition-colors" data-testid={`row-priority-${village.village_id}`}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center bg-[#263440] font-mono text-xs font-bold text-[#f2eee4]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/villages/${village.village_id}`}
                            className="text-base font-bold hover:text-[#b65343] transition-colors"
                            data-testid={`link-priority-record-${village.village_id}`}
                          >
                            {village.village_name}
                          </Link>
                          <StatusPill value={village.priority_bucket} tone={bucketTone[village.priority_bucket] ?? "green"} />
                          <StatusPill value={`${village.zone_color} Zone`} tone={village.zone_color === "Red" ? "red" : village.zone_color === "Orange" ? "orange" : "yellow"} />
                        </div>
                        <p className="mt-1 font-mono text-xs text-[#60717c]">
                          {village.lat.toFixed(3)}°N, {village.lon.toFixed(3)}°E · {formatNumber(village.population)} residents ({formatNumber(village.households)} hh) · {village.historical_incidents} incident(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-6 md:justify-end">
                      <div className="text-left md:text-right">
                        <p className="font-mono text-[9px] uppercase tracking-[.1em] text-[#60717c]">Priority Score</p>
                        <p className="font-mono text-2xl font-bold text-[#263440]">{village.priority_score.toFixed(1)}</p>
                      </div>
                      <Link
                        href={`/relocation/${village.village_id}`}
                        className="inline-flex items-center gap-2 bg-[#3f7069] px-3.5 py-2.5 text-xs font-bold text-[#f2eee4] hover:bg-[#263440] transition-colors"
                        data-testid={`link-relocate-${village.village_id}`}
                      >
                        <Route size={14} /> Screen Safe Sites <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>

                  {/* ML & Risk Indicators Row */}
                  <div className="mt-3.5 grid gap-2.5 sm:grid-cols-4 bg-[#f2eee4] p-3 border border-[#e3ded4] text-xs">
                    <div>
                      <span className="block font-mono text-[9px] uppercase text-[#8a989a]">Final Risk Score</span>
                      <b className="font-mono text-sm text-[#984636]">{finalRisk}%</b>
                    </div>
                    <div>
                      <span className="block font-mono text-[9px] uppercase text-[#8a989a]">ML Landslide Prob</span>
                      <b className="font-mono text-sm text-[#a55b28]">{mlProb.toFixed(1)}%</b>
                    </div>
                    <div>
                      <span className="block font-mono text-[9px] uppercase text-[#8a989a]">Est. Relocation Demand</span>
                      <b className="font-mono text-sm text-[#263440]">~{awaitingFams} families</b>
                    </div>
                    <div>
                      <span className="block font-mono text-[9px] uppercase text-[#8a989a]">Movement Pattern</span>
                      <b className="text-xs text-[#3f7069] truncate block">{movement}</b>
                    </div>
                  </div>

                  {/* Compact Why This Village Explanation */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#60717c]">
                    <span className="font-mono text-[9px] uppercase font-bold text-[#b65343]">Why this village:</span>
                    {reasons.map((r, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[11px] text-[#263440]">
                        <span className="text-[#3f7069]">•</span> {r}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
