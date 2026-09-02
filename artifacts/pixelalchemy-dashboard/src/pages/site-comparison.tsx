import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, GitCompareArrows, Route } from "lucide-react";
import { Link } from "wouter";
import { getGetRelocationQueryKey, useGetRelocation, useGetVillages } from "@workspace/api-client-react";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageIntro, StatusPill, formatNumber } from "@/components/dashboard-shell";
import { SourceVillagePicker } from "@/components/relocation-tools";

interface ComparisonRow {
  key: string;
  label: string;
  format: (value: any) => string;
}

const comparisonRows: ComparisonRow[] = [
  { key: "suitability_score", label: "AHP Suitability score", format: (value: number) => (value * 100).toFixed(1) },
  { key: "capacity_status", label: "Carrying capacity status", format: (value: string) => String(value) },
  { key: "available_capacity", label: "Available capacity", format: (value: number) => `${formatNumber(value)} places` },
  { key: "distance_to_road_km", label: "Distance to road", format: (value: number) => `${value.toFixed(1)} km` },
  { key: "distance_to_water_km", label: "Distance to water", format: (value: number) => `${value.toFixed(1)} km` },
  { key: "distance_to_healthcare_km", label: "Distance to healthcare", format: (value: number) => `${value.toFixed(1)} km` },
];

export default function SiteComparison() {
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

  const sites = relocationQuery.data?.recommendations.slice(0, 3) ?? [];
  const mlDemand = (relocationQuery.data as any)?.ml_relocation_demand_families ?? relocationQuery.data?.village?.awaiting_families_estimate ?? 0;

  return (
    <DashboardShell>
      <PageIntro
        eyebrow="Comparison Desk · ML Demand & AHP Ranks"
        title="Candidate Site Comparison"
        description="Side-by-side comparison of leading candidate sites against ML relocation demand, road access, water distance, healthcare proximity, and verified carrying capacity."
        action={<StatusPill value={sites.length ? `${sites.length} sites compared` : "Awaiting sites"} tone="green" />}
      />

      <section className="mb-5 border border-[#d7d1c5] bg-[#f7f3ea] p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(240px,.6fr)_1.4fr] md:items-end">
          <SourceVillagePicker villages={villages} selectedId={selectedId} onChange={setSelectedId} />
          <p className="text-xs leading-5 text-[#60717c]">
            Comparing candidate sites for <b className="text-[#263440]">{relocationQuery.data?.village.village_name ?? "selected village"}</b> against ML estimated demand of <b className="text-[#a55b28]">~{mlDemand} families</b> ({formatNumber(relocationQuery.data?.village.population ?? 0)} people).
          </p>
        </div>
      </section>

      {relocationQuery.isLoading ? (
        <LoadingState label="Preparing site comparison" />
      ) : relocationQuery.isError ? (
        <ErrorState onRetry={() => relocationQuery.refetch()} label="The comparison data could not be loaded." />
      ) : sites.length === 0 ? (
        <EmptyState title="No candidate sites to compare" description="Choose another source village or wait for the relocation layer to return candidate sites." />
      ) : (
        <section className="overflow-x-auto border border-[#d7d1c5] bg-[#fbf9f3]">
          <div className="min-w-[760px]">
            <div className="flex items-center gap-3 border-b border-[#e3ded4] p-5">
              <GitCompareArrows size={18} className="text-[#3f7069]" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#60717c]">Top Ranked Candidates</p>
                <h2 className="mt-1 text-base font-bold">{relocationQuery.data?.village.village_name}</h2>
              </div>
            </div>
            <div className="grid grid-cols-[200px_repeat(3,minmax(190px,1fr))]">
              {sites.map((site, index) => (
                <div key={site.site_id} className={`border-b border-l border-[#e3ded4] p-4 ${index === 0 ? "bg-[#e0ebe7]" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] text-[#60717c]">Rank 0{site.rank}</span>
                    {index === 0 && <CheckCircle2 size={15} className="text-[#3f7069]" />}
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-[#263440]">{site.site_name}</h3>
                  <p className="mt-1 font-mono text-[9px] uppercase text-[#8a989a]">
                    {site.hazard_zone} Hazard Zone · {site.capacity_status}
                  </p>
                </div>
              ))}

              <div className="border-b border-[#e3ded4] p-4">
                <span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#60717c]">Evaluation Metric</span>
              </div>

              {comparisonRows.map((row) => (
                <Fragment key={row.key}>
                  <div className="border-b border-[#e3ded4] p-4 text-xs font-semibold text-[#60717c]">
                    {row.label}
                  </div>
                  {sites.map((site) => (
                    <div key={`${row.key}-${site.site_id}`} className="border-b border-l border-[#e3ded4] p-4 font-mono text-sm font-bold text-[#263440]">
                      {row.format((site as any)[row.key])}
                    </div>
                  ))}
                </Fragment>
              ))}

              <div className="p-4 text-xs text-[#60717c]">Full Relocation Record</div>
              {sites.map((site) => (
                <div key={`open-${site.site_id}`} className="border-l border-[#e3ded4] p-4">
                  <Link
                    href={`/relocation/${selectedId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#3f7069] hover:text-[#b65343] transition-colors"
                    data-testid={`link-comparison-detail-${site.site_id}`}
                  >
                    View All Details <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mt-5 flex items-center gap-2 text-xs text-[#60717c]">
        <Route size={15} className="text-[#b65343]" />
        <span>
          Carrying capacity and AHP rankings are verified in the backend pipeline using ML relocation demand; no rankings are computed in the browser.
        </span>
      </div>
    </DashboardShell>
  );
}
