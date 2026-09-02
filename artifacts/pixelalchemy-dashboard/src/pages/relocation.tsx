import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, CircleAlert, CircleHelp, Cpu, Layers, Route, ShieldAlert, ShieldCheck, Sparkles, Users } from "lucide-react";
import { getGetRelocationQueryKey, useGetRelocation } from "@workspace/api-client-react";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageIntro, StatusPill, formatKey, formatNumber } from "@/components/dashboard-shell";
import { MetricBar } from "@/components/data-visuals";

export default function Relocation() {
  const params = useParams<{ villageId: string }>();
  const villageId = params.villageId ?? "";
  const query = useGetRelocation(villageId, { query: { enabled: Boolean(villageId), queryKey: getGetRelocationQueryKey(villageId) } });

  if (query.isLoading) return <DashboardShell><LoadingState label="Evaluating candidate sites with ML demand + AHP" /></DashboardShell>;
  if (query.isError || !query.data) return <DashboardShell><ErrorState onRetry={() => query.refetch()} label="Relocation recommendations could not be loaded." /></DashboardShell>;

  const { village, recommendations, criteria_weights: criteriaWeights } = query.data;
  const best = recommendations[0];
  const mlDemandFamilies = (query.data as any).ml_relocation_demand_families ?? village.awaiting_families_estimate ?? Math.round(village.households * 0.15);
  const readySites = recommendations.filter((s) => s.capacity_status === "Ready").length;
  const limitedSites = recommendations.filter((s) => s.capacity_status === "Limited").length;
  const insufficientSites = recommendations.filter((s) => s.capacity_status === "Insufficient").length;

  return (
    <DashboardShell>
      <div className="mb-5">
        <Link href={`/villages/${village.village_id}`} className="inline-flex items-center gap-2 text-xs font-semibold text-[#60717c] hover:text-[#b65343]" data-testid="link-back-village">
          <ArrowLeft size={14} /> Back to Village Assessment
        </Link>
      </div>

      <PageIntro
        eyebrow="Decision Workflow · ML Demand → Capacity → AHP Ranking"
        title={`Safe Relocation Sites for ${village.village_name}`}
        description="Transparent multi-stage site recommendation: ML estimates relocation demand, carrying capacity filters viable ground, and explainable AHP ranks site suitability."
        action={<StatusPill value={`${recommendations.length} candidate sites`} tone="green" />}
      />

      {/* Visual Workflow Stepper */}
      <section className="mb-5 border border-[#d7d1c5] bg-[#f7f3ea] p-4">
        <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#60717c] font-semibold mb-3">
          Relocation Decision Pipeline
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-xs text-[#263440]">
          <div className="border border-[#cb7339]/40 bg-[#fbefe1] p-2.5">
            <span className="block text-[9px] uppercase text-[#a55b28] font-bold">1. ML Demand</span>
            <b>~{mlDemandFamilies} Families</b>
          </div>
          <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-2.5">
            <span className="block text-[9px] uppercase text-[#60717c]">2. Required Cap</span>
            <b>{formatNumber(village.population)} People</b>
          </div>
          <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-2.5">
            <span className="block text-[9px] uppercase text-[#60717c]">3. Capacity Check</span>
            <b>{readySites} Ready · {limitedSites} Lim</b>
          </div>
          <div className="border border-[#3f7069]/40 bg-[#e0ebe7] p-2.5">
            <span className="block text-[9px] uppercase text-[#3f7069] font-bold">4. AHP Suitability</span>
            <b>#1 {best?.site_name ?? "None"}</b>
          </div>
        </div>
      </section>

      {/* Top Banner: ML Relocation Demand & Source Village */}
      <section className="mb-5 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <div className="border border-[#2f4a4d] bg-[#3f7069] p-6 text-[#f2eee4]">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.17em] text-[#c2d6cd]">Relocation Demand</p>
              <h2 className="mt-1 text-2xl font-bold">{village.village_name}</h2>
            </div>
            <Route size={21} className="text-[#e8b84c]" />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#6f958d] pt-4">
            <div>
              <p className="font-mono text-[9px] uppercase text-[#c2d6cd]">ML Est. Families</p>
              <p className="mt-1 font-mono text-xl font-bold text-[#e8b84c]">~{mlDemandFamilies}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase text-[#c2d6cd]">Total Residents</p>
              <p className="mt-1 font-mono text-lg font-bold">{formatNumber(village.population)}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase text-[#c2d6cd]">Final Hazard</p>
              <p className="mt-1 font-mono text-lg font-bold">{(village.hazard_score * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* AHP Criteria Weights */}
        <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
          <div className="flex items-center justify-between border-b border-[#e8e3da] pb-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#60717c]">AHP Criteria Weights</p>
              <h2 className="mt-0.5 text-base font-bold">Multi-Criteria Formula</h2>
            </div>
            <CircleHelp size={16} className="text-[#60717c]" />
          </div>
          <div className="mt-3 space-y-2">
            {Object.entries(criteriaWeights).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-[#60717c]">{formatKey(key)}</span>
                <span className="font-mono font-bold text-[#263440]">{(value * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capacity Screening Summary */}
      <section className="mb-5 border border-[#d7d1c5] bg-[#fbf9f3] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#e3ded4] pb-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#3f7069] font-bold">Stage 2: Capacity Screening</p>
            <h2 className="text-base font-bold">Carrying Capacity Feasibility Check</h2>
          </div>
          <div className="flex gap-2">
            <StatusPill value={`${readySites} Ready`} tone="green" />
            <StatusPill value={`${limitedSites} Limited`} tone="yellow" />
            <StatusPill value={`${insufficientSites} Insufficient`} tone="red" />
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#60717c]">
          Candidate site available capacity (<span className="font-mono">carrying_capacity - existing_population</span>) is evaluated against village demand. Ready sites receive a feasibility incentive (+0.08 AHP boost), while insufficient sites receive a penalty (-0.12).
        </p>
      </section>

      {/* Ranked Candidate Sites */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#b65343] font-bold">Stage 3: AHP Site Suitability</p>
          <h2 className="mt-0.5 text-xl font-bold">Ranked Safe Relocation Sites</h2>
        </div>
        {best && (
          <p className="hidden text-xs text-[#60717c] md:block">
            Top match: <span className="font-bold text-[#263440]">{best.site_name}</span> (AHP Score: {(best.suitability_score).toFixed(3)})
          </p>
        )}
      </div>

      <section className="space-y-4">
        {recommendations.length === 0 ? (
          <EmptyState title="No candidate sites found" description="No relocation sites matched the criteria for this village." />
        ) : (
          recommendations.map((site, index) => (
            <article
              key={site.site_id}
              className={`border bg-[#fbf9f3] p-5 transition-colors ${
                index === 0 ? "border-[#3f7069] border-l-4 shadow-sm" : "border-[#d7d1c5]"
              }`}
              data-testid={`card-relocation-site-${site.site_id}`}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 gap-4">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center font-mono text-sm font-bold ${
                      index === 0 ? "bg-[#e8b84c] text-[#263440]" : "bg-[#e3e5df] text-[#60717c]"
                    }`}
                  >
                    {String(site.rank).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-[#263440]">{site.site_name}</h3>
                      {index === 0 && <StatusPill value="Top Recommendation" tone="green" />}
                      <StatusPill
                        value={`Capacity: ${site.capacity_status}`}
                        tone={site.capacity_status === "Ready" ? "green" : site.capacity_status === "Limited" ? "yellow" : "red"}
                      />
                    </div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[.09em] text-[#8a989a]">
                      {site.hazard_zone} Hazard Zone · {site.land_availability} Land Availability · {site.lat.toFixed(3)}°N, {site.lon.toFixed(3)}°E
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#60717c]">
                      <span>Road: <b className="font-mono text-[#263440]">{site.distance_to_road_km.toFixed(1)} km</b></span>
                      <span>Water: <b className="font-mono text-[#263440]">{site.distance_to_water_km.toFixed(1)} km</b></span>
                      <span>Healthcare: <b className="font-mono text-[#263440]">{site.distance_to_healthcare_km.toFixed(1)} km</b></span>
                    </div>
                  </div>
                </div>

                <div className="w-full shrink-0 border-t border-[#e8e3da] pt-4 lg:w-[300px] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[.12em] text-[#60717c]">AHP Suitability Score</p>
                      <p className="mt-1 text-3xl font-bold font-mono text-[#263440]">
                        {(site.suitability_score * 100).toFixed(1)}<span className="ml-1 text-xs font-normal text-[#60717c]">/ 100</span>
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#3f7069]">
                      ({site.suitability_score.toFixed(3)})
                    </span>
                  </div>
                  <div className="mt-3 h-2 bg-[#e2ded3]">
                    <div className="h-full bg-[#3f7069]" style={{ width: `${Math.min(site.suitability_score * 100, 100)}%` }} />
                  </div>
                  <p className="mt-2 font-mono text-[10px] text-[#60717c]">
                    {formatNumber(site.available_capacity)} available / {formatNumber(site.carrying_capacity)} max capacity
                  </p>
                </div>
              </div>

              <details className="mt-4 border-t border-[#e8e3da] pt-3.5">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-[#3f7069]" data-testid={`button-score-breakdown-${site.site_id}`}>
                  <ChevronDown size={14} /> View AHP Criteria Score Breakdown
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
                  {Object.entries(site.score_breakdown).map(([key, value]) => (
                    <div key={key} className="bg-[#f2eee4] p-2.5 border border-[#e3ded4]">
                      <span className="block font-mono text-[9px] uppercase text-[#8a989a]">{formatKey(key)}</span>
                      <b className="mt-1 block font-mono text-sm text-[#263440]">{(value * 100).toFixed(1)}</b>
                    </div>
                  ))}
                </div>
              </details>
            </article>
          ))
        )}
      </section>

      <div className="mt-5 flex items-center gap-2 border border-[#d7d1c5] bg-[#f7f3ea] p-4 text-xs text-[#60717c]">
        <ShieldCheck size={16} className="shrink-0 text-[#3f7069]" />
        <span>
          AHP suitability rankings and capacity verifications provide transparent decision support for district planning. Final relocation site agreements are conducted in consultation with village leadership.
        </span>
      </div>
    </DashboardShell>
  );
}
