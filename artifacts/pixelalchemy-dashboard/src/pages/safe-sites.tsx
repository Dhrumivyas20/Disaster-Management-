import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Compass, Cpu, Layers, MapPin, Users } from "lucide-react";
import { Link } from "wouter";
import { getGetRelocationQueryKey, useGetRelocation, useGetVillages } from "@workspace/api-client-react";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageIntro, StatusPill, formatNumber } from "@/components/dashboard-shell";
import { CapacityStat, DistanceStat, SourceVillagePicker } from "@/components/relocation-tools";

export default function SafeSites() {
  const villagesQuery = useGetVillages();
  const villages = useMemo(() => villagesQuery.data ?? [], [villagesQuery.data]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!selectedId && villages[0]) setSelectedId(villages[0].village_id);
  }, [selectedId, villages]);

  const relocationQuery = useGetRelocation(selectedId, {
    query: { enabled: Boolean(selectedId), queryKey: getGetRelocationQueryKey(selectedId) },
  });

  if (villagesQuery.isLoading) return <DashboardShell><LoadingState label="Loading source villages" /></DashboardShell>;
  if (villagesQuery.isError) return <DashboardShell><ErrorState onRetry={() => villagesQuery.refetch()} label="Source villages could not be loaded." /></DashboardShell>;
  if (!villages.length) {
    return (
      <DashboardShell>
        <PageIntro eyebrow="Site Discovery · Source Community" title="Safe Sites" description="Choose a source village to search its ranked candidate sites." />
        <EmptyState title="No source villages available" description="Candidate site discovery needs a village with a scored record." />
      </DashboardShell>
    );
  }

  const response = relocationQuery.data;
  const mlDemand = (response as any)?.ml_relocation_demand_families ?? response?.village?.awaiting_families_estimate ?? 0;

  return (
    <DashboardShell>
      <PageIntro
        eyebrow="Site Discovery · ML Demand & AHP Ranking"
        title="Safe Relocation Sites"
        description="Select a source village to evaluate candidate sites against ML relocation demand, verified carrying capacity, and AHP multi-criteria suitability."
        action={<StatusPill value={response ? `${response.recommendations.length} candidates evaluated` : "Selecting source"} tone="green" />}
      />

      <section className="mb-5 border border-[#d7d1c5] bg-[#f7f3ea] p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(240px,.6fr)_1.4fr] md:items-end">
          <SourceVillagePicker villages={villages} selectedId={selectedId} onChange={setSelectedId} />
          <div className="flex flex-col gap-1.5 text-xs leading-5 text-[#60717c]">
            <div className="flex items-center gap-2 text-[#263440] font-semibold">
              <Compass size={16} className="text-[#3f7069]" />
              <span>
                ML Estimated Demand: <b className="text-[#a55b28]">~{mlDemand} families</b> ({formatNumber(response?.village?.population ?? 0)} residents)
              </span>
            </div>
            <span>
              A capacity status of <b className="text-[#3f7069]">Ready</b> indicates available site capacity covers source population requirements with a +0.08 AHP boost.
            </span>
          </div>
        </div>
      </section>

      {relocationQuery.isLoading ? (
        <LoadingState label="Ranking candidate sites via AHP" />
      ) : relocationQuery.isError || !response ? (
        <ErrorState onRetry={() => relocationQuery.refetch()} label="Candidate sites could not be loaded." />
      ) : (
        <section className="space-y-3">
          {response.recommendations.length === 0 ? (
            <EmptyState title="No candidate sites returned" description="No sites met the current relocation criteria for this source village." />
          ) : (
            response.recommendations.map((site, index) => (
              <article
                key={site.site_id}
                className={`border bg-[#fbf9f3] p-5 transition-colors ${
                  index === 0 ? "border-[#3f7069] border-l-4 shadow-sm" : "border-[#d7d1c5]"
                }`}
                data-testid={`card-safe-site-${site.site_id}`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center bg-[#e8b84c] font-mono text-xs font-bold text-[#263440]">
                      {String(site.rank).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-[#263440]">{site.site_name}</h2>
                        {index === 0 && <StatusPill value="Top Match" tone="green" />}
                        <StatusPill
                          value={site.capacity_status}
                          tone={site.capacity_status === "Ready" ? "green" : site.capacity_status === "Limited" ? "yellow" : "red"}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#60717c]">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <MapPin size={12} /> {site.hazard_zone} Hazard Zone
                        </span>
                        <span>{site.land_availability} Land Availability</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[#e8e3da] pt-4 sm:grid-cols-3 lg:w-[440px] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <CapacityStat available={site.available_capacity} total={site.carrying_capacity} />
                    <DistanceStat label="Road access" value={site.distance_to_road_km} />
                    <DistanceStat label="Healthcare" value={site.distance_to_healthcare_km} />
                  </div>

                  <div className="flex items-center gap-3 lg:w-[155px] lg:justify-end">
                    <div className="text-left lg:text-right">
                      <p className="font-mono text-[9px] uppercase tracking-[.1em] text-[#60717c]">AHP Suitability</p>
                      <p className="font-mono text-2xl font-bold text-[#263440]">{(site.suitability_score * 100).toFixed(1)}</p>
                    </div>
                    <Link
                      href={`/relocation/${selectedId}`}
                      className="grid h-8 w-8 place-items-center border border-[#d7d1c5] text-[#3f7069] hover:border-[#3f7069] transition-colors"
                      aria-label={`Open all relocation details for ${site.site_name}`}
                      data-testid={`link-site-detail-${site.site_id}`}
                    >
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#e8e3da] pt-3 text-xs text-[#60717c]">
                  <div className="flex items-center gap-2">
                    {site.capacity_status === "Ready" ? (
                      <CheckCircle2 size={14} className="text-[#3f7069]" />
                    ) : (
                      <Compass size={14} className="text-[#b65343]" />
                    )}
                    <span>
                      {formatNumber(site.available_capacity)} available places · {site.distance_to_water_km.toFixed(1)} km to water
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#8a989a]">
                    AHP Score: {site.suitability_score.toFixed(3)}
                  </span>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </DashboardShell>
  );
}
