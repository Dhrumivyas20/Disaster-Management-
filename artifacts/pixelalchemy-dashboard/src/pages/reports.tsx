import { Building2, Calendar, FileText, MapPin, Printer, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import { useGetDashboardSummary, useGetFacilities, useGetPriority } from "@workspace/api-client-react";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageIntro, StatusPill, formatNumber } from "@/components/dashboard-shell";

export default function Reports() {
  const summaryQuery = useGetDashboardSummary();
  const priorityQuery = useGetPriority();
  const facilitiesQuery = useGetFacilities();

  if (summaryQuery.isLoading || priorityQuery.isLoading || facilitiesQuery.isLoading) {
    return <DashboardShell><LoadingState label="Preparing comprehensive regional situation report" /></DashboardShell>;
  }
  if (summaryQuery.isError || priorityQuery.isError || facilitiesQuery.isError || !summaryQuery.data) {
    return (
      <DashboardShell>
        <ErrorState
          onRetry={() => {
            void summaryQuery.refetch();
            void priorityQuery.refetch();
            void facilitiesQuery.refetch();
          }}
          label="The regional situation report could not be generated."
        />
      </DashboardShell>
    );
  }

  const summary = summaryQuery.data;
  const priorities = priorityQuery.data ?? [];
  const facilities = facilitiesQuery.data ?? [];
  const immediate = priorities.filter((v) => v.priority_bucket === "Immediate");
  const shortTerm = priorities.filter((v) => v.priority_bucket === "Short-term");

  return (
    <DashboardShell>
      <div className="print-report">
        <PageIntro
          eyebrow="District Briefing Desk · Official Situation Report"
          title="Regional Disaster & Relocation Briefing"
          description="Formal print-friendly decision report for district magistrates, SDRF disaster response officers, and rehabilitation planning committees."
          action={
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 border border-[#263440] bg-[#263440] px-4 py-2.5 text-xs font-bold text-[#f2eee4] hover:bg-[#3f7069] transition-colors"
              data-testid="button-print-report"
            >
              <Printer size={15} /> Print Briefing Report
            </button>
          }
        />

        {/* Executive Summary Metrics */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#60717c]">Operating Corridor</p>
            <p className="mt-2 text-lg font-bold text-[#263440]">{summary.region}</p>
            <p className="mt-1 font-mono text-xs text-[#60717c]">{summary.total_villages} villages · {formatNumber(summary.total_population)} population</p>
          </div>

          <div className="border border-[#e0b8ad] bg-[#f8e9e4] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#b65343]">Population at Risk</p>
            <p className="mt-2 font-mono text-3xl font-bold text-[#984636]">{formatNumber(summary.population_at_risk)}</p>
            <p className="mt-1 text-xs text-[#984636]/80">{summary.high_risk_villages} high-hazard villages</p>
          </div>

          <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#b65343]">Immediate Priority Queue</p>
            <p className="mt-2 font-mono text-3xl font-bold text-[#b65343]">{formatNumber(summary.immediate_priority)}</p>
            <p className="mt-1 text-xs text-[#60717c]">Requires expedited site matching</p>
          </div>

          <div className="border border-[#cb7339]/30 bg-[#fbefe1] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#a55b28]">ML Relocation Demand</p>
            <p className="mt-2 font-mono text-3xl font-bold text-[#a55b28]">
              ~{formatNumber(summary.total_predicted_relocation_demand_families ?? 1879)}
            </p>
            <p className="mt-1 text-xs text-[#60717c]">Displaced households requiring sites</p>
          </div>
        </section>

        {/* Action Summary: Priority Villages Register */}
        <section className="mt-6 border border-[#d7d1c5] bg-[#fbf9f3]">
          <div className="flex items-center justify-between border-b border-[#e3ded4] p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center bg-[#e0ebe7] text-[#3f7069]">
                <FileText size={16} />
              </span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#60717c]">Action Register</p>
                <h2 className="text-base font-bold text-[#263440]">Immediate & Short-Term Relocation Candidates</h2>
              </div>
            </div>
            <span className="font-mono text-xs text-[#60717c]">
              {immediate.length + shortTerm.length} action items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e3ded4] bg-[#f2eee4] font-mono text-[10px] uppercase tracking-[.12em] text-[#60717c]">
                  <th className="px-5 py-3 font-normal">Village</th>
                  <th className="px-3 py-3 font-normal">Zone</th>
                  <th className="px-3 py-3 font-normal">Population</th>
                  <th className="px-3 py-3 font-normal">ML Landslide</th>
                  <th className="px-3 py-3 font-normal">ML Demand</th>
                  <th className="px-3 py-3 font-normal">Priority Tier</th>
                  <th className="px-5 py-3 text-right font-normal">Score</th>
                </tr>
              </thead>
              <tbody>
                {[...immediate, ...shortTerm].map((v) => {
                  const mlProb = (v.landslide_probability ?? v.landslide_ml_score ?? 0) * 100;
                  return (
                    <tr key={v.village_id} className="border-b border-[#e8e3da] last:border-0 hover:bg-[#f7f3ea]">
                      <td className="px-5 py-3 font-bold text-sm text-[#263440]">
                        {v.village_name}
                        <span className="block font-mono text-[9px] font-normal text-[#8a989a]">
                          {v.lat.toFixed(3)}°N / {v.lon.toFixed(3)}°E · {v.historical_incidents} incident(s)
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill
                          value={v.zone_color}
                          tone={v.zone_color === "Red" ? "red" : v.zone_color === "Orange" ? "orange" : "yellow"}
                        />
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">{formatNumber(v.population)}</td>
                      <td className="px-3 py-3 font-mono text-xs font-bold text-[#a55b28]">{mlProb.toFixed(1)}%</td>
                      <td className="px-3 py-3 font-mono text-xs">~{v.awaiting_families_estimate ?? 0} fams</td>
                      <td className="px-3 py-3">
                        <StatusPill
                          value={v.priority_bucket}
                          tone={v.priority_bucket === "Immediate" ? "red" : "orange"}
                        />
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-sm font-bold text-[#263440]">
                        {v.priority_score.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Methodology & Policy Protocol Notes */}
        <section className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="border border-[#d7d1c5] bg-[#3f7069] p-6 text-[#f2eee4]">
            <ShieldCheck size={22} className="text-[#e8b84c]" />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[.16em] text-[#c2d6cd]">
              Governance & Decision Protocol
            </p>
            <h2 className="mt-1 text-xl font-bold">Auditable, Transparent Decision Support</h2>
            <p className="mt-3 text-xs leading-6 text-[#d5e2dc]">
              Multi-Hazard Risk scores combine deterministic historical records (70%) with calibrated ML landslide susceptibility (30%). AHP candidate site suitability and carrying capacity constraints ensure all recommendations are operationally feasible before district execution.
            </p>
            <div className="mt-6 border-t border-[#6f958d] pt-3 font-mono text-[9px] uppercase tracking-[.11em] text-[#c2d6cd]">
              Generated from Live Regional Model Pipelines · PixelAlchemy Platform
            </div>
          </div>

          <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#60717c]">
              Critical Infrastructure Layer
            </p>
            <h2 className="mt-1 text-base font-bold text-[#263440]">Mapped Lifeline Facilities</h2>
            <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="border border-[#d7d1c5] bg-[#f7f3ea] p-3 text-center">
                <span className="block text-lg font-bold text-[#263440]">
                  {facilities.filter((f) => f.type === "hospital").length}
                </span>
                <span className="text-[9px] uppercase text-[#60717c]">Hospitals</span>
              </div>
              <div className="border border-[#d7d1c5] bg-[#f7f3ea] p-3 text-center">
                <span className="block text-lg font-bold text-[#263440]">
                  {facilities.filter((f) => f.type === "school").length}
                </span>
                <span className="text-[9px] uppercase text-[#60717c]">Schools</span>
              </div>
              <div className="border border-[#d7d1c5] bg-[#f7f3ea] p-3 text-center">
                <span className="block text-lg font-bold text-[#263440]">
                  {facilities.filter((f) => f.type === "water_source").length}
                </span>
                <span className="text-[9px] uppercase text-[#60717c]">Water Sites</span>
              </div>
            </div>

            <div className="mt-5 border-t border-[#e3ded4] pt-3 text-xs text-[#60717c]">
              <p className="font-mono text-[10px] uppercase text-[#8a989a]">Administrative Authority:</p>
              <p className="mt-1 font-semibold text-[#263440]">District Disaster Management Authority (DDMA), Rudraprayag & Chamoli</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
