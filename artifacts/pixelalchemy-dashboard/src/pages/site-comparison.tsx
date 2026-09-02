import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, GitCompareArrows, Route, ShieldCheck } from "lucide-react";
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
  { key: "suitability_score", label: "AHP Suitability Score", format: (value: number) => `${(value * 100).toFixed(1)} / 100` },
  { key: "capacity_status", label: "Carrying Capacity Status", format: (value: string) => String(value) },
  { key: "available_capacity", label: "Available Capacity", format: (value: number) => `${formatNumber(value)} places` },
  { key: "distance_to_road_km", label: "Distance to Road", format: (value: number) => `${value.toFixed(1)} km` },
  { key: "distance_to_water_km", label: "Distance to Water Source", format: (value: number) => `${value.toFixed(1)} km` },
  { key: "distance_to_healthcare_km", label: "Distance to Healthcare", format: (value: number) => `${value.toFixed(1)} km` },
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

  if (villagesQuery.isLoading) {
    return (
      <DashboardShell>
        <LoadingState label="Loading source villages" />
      </DashboardShell>
    );
  }
  if (villagesQuery.isError) {
    return (
      <DashboardShell>
        <ErrorState onRetry={() => villagesQuery.refetch()} label="Source villages could not be loaded." />
      </DashboardShell>
    );
  }

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

      {/* Source Village Selector Bar */}
      <section className="mb-6 rounded-xl border border-[#727270]/20 bg-[#FEFEFE] p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[minmax(260px,.6fr)_1.4fr] md:items-center">
          <SourceVillagePicker villages={villages} selectedId={selectedId} onChange={setSelectedId} />
          <div className="rounded-lg bg-[#ECE5DC]/40 px-4 py-3 border border-[#727270]/15">
            <p className="text-xs leading-5 text-[#727270]">
              Evaluating candidate relocation sites for{" "}
              <b className="font-serif text-[#4B5125] text-sm">{relocationQuery.data?.village.village_name ?? "selected village"}</b>{" "}
              against ML estimated demand of{" "}
              <b className="font-mono text-[#a55b28]">~{mlDemand} families</b> (
              {formatNumber(relocationQuery.data?.village.population ?? 0)} residents).
            </p>
          </div>
        </div>
      </section>

      {relocationQuery.isLoading ? (
        <LoadingState label="Preparing site comparison" />
      ) : relocationQuery.isError ? (
        <ErrorState onRetry={() => relocationQuery.refetch()} label="The comparison data could not be loaded." />
      ) : sites.length === 0 ? (
        <EmptyState
          title="No candidate sites to compare"
          description="Choose another source village or wait for the relocation layer to return candidate sites."
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-[#727270]/20 bg-[#FEFEFE] shadow-sm">
          {/* Table Header Strip */}
          <div className="flex items-center justify-between border-b border-[#727270]/20 bg-[#ECE5DC]/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#4B5125] text-[#FEFEFE] shadow-xs">
                <GitCompareArrows size={17} />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#727270] font-semibold">
                  Top Ranked Relocation Candidates
                </p>
                <h2 className="font-serif text-lg font-bold text-[#4B5125]">
                  {relocationQuery.data?.village.village_name} Relocation Matrix
                </h2>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-[#727270]">
              <ShieldCheck size={15} className="text-[#4B5125]" />
              <span>AHP Multi-Criteria Model Verified</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              {/* Correct 4-Column Grid: Column 1 is Metric, Columns 2-4 are Sites 1, 2, 3 */}
              <div className="grid grid-cols-[220px_repeat(3,minmax(200px,1fr))]">
                {/* 1. Header Row - Column 1: Evaluation Metric */}
                <div className="border-b border-[#727270]/20 bg-[#ECE5DC]/50 p-5 flex flex-col justify-end">
                  <span className="font-mono text-[11px] uppercase tracking-[.16em] text-[#727270] font-bold">
                    Evaluation Metric
                  </span>
                  <span className="text-xs font-serif text-[#4B5125] font-semibold mt-0.5">
                    Multi-Criteria Baseline
                  </span>
                </div>

                {/* 1. Header Row - Columns 2, 3, 4: The 3 Candidate Sites */}
                {sites.map((site, index) => (
                  <div
                    key={site.site_id}
                    className={`border-b border-l border-[#727270]/20 p-5 flex flex-col justify-between ${
                      index === 0 ? "bg-[#F0F1DB]/70" : "bg-[#FEFEFE]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#4B5125]">
                          Rank 0{site.rank}
                        </span>
                        {index === 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#4B5125] px-2.5 py-0.5 text-[9px] font-bold text-[#FEFEFE] uppercase tracking-wider">
                            <CheckCircle2 size={11} /> Top Pick
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 text-base font-bold text-[#4B5125] font-serif">
                        {site.site_name}
                      </h3>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-[10px]">
                      <span className="rounded-full bg-[#4c806d]/15 px-2.5 py-0.5 font-bold text-[#4c806d]">
                        {site.hazard_zone} Zone
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-bold ${
                          (site.capacity_status as string) === "Sufficient"
                            ? "bg-[#4c806d]/15 text-[#4c806d]"
                            : (site.capacity_status as string) === "Limited"
                              ? "bg-[#cb7339]/15 text-[#cb7339]"
                              : "bg-[#b65343]/15 text-[#b65343]"
                        }`}
                      >
                        {site.capacity_status}
                      </span>
                    </div>
                  </div>
                ))}

                {/* 2. Data Rows: Metric Label in Col 1, Site Values in Cols 2, 3, 4 */}
                {comparisonRows.map((row) => (
                  <Fragment key={row.key}>
                    {/* Col 1: Metric Label */}
                    <div className="border-b border-[#727270]/20 bg-[#ECE5DC]/25 p-4 text-xs font-bold text-[#4B5125] flex items-center">
                      {row.label}
                    </div>

                    {/* Cols 2, 3, 4: Site Data */}
                    {sites.map((site, index) => (
                      <div
                        key={`${row.key}-${site.site_id}`}
                        className={`border-b border-l border-[#727270]/20 p-4 font-mono text-sm font-bold flex items-center ${
                          index === 0 ? "bg-[#F0F1DB]/25 text-[#4B5125]" : "text-[#263440]"
                        }`}
                      >
                        {row.format((site as any)[row.key])}
                      </div>
                    ))}
                  </Fragment>
                ))}

                {/* 3. Action Row: Relocation Link */}
                <div className="bg-[#ECE5DC]/25 p-4 text-xs font-bold text-[#727270] flex items-center">
                  Full Relocation Dossier
                </div>
                {sites.map((site, index) => (
                  <div
                    key={`open-${site.site_id}`}
                    className={`border-l border-[#727270]/20 p-4 ${index === 0 ? "bg-[#F0F1DB]/25" : ""}`}
                  >
                    <Link
                      href={`/relocation/${selectedId}?site=${site.site_id}`}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-colors shadow-xs ${
                        index === 0
                          ? "bg-[#4B5125] text-[#FEFEFE] hover:bg-[#383d1c]"
                          : "border border-[#727270]/25 bg-[#F0F1DB] text-[#4B5125] hover:bg-[#ECE5DC]"
                      }`}
                      data-testid={`link-comparison-detail-${site.site_id}`}
                    >
                      View Dossier <ArrowRight size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Methodology Footer */}
      <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-[#727270]/20 bg-[#FEFEFE] px-5 py-3.5 shadow-xs text-xs text-[#727270]">
        <Route size={16} className="text-[#4B5125] shrink-0" />
        <span>
          Carrying capacity and AHP rankings are verified in the backend pipeline using ML relocation demand; no rankings are computed in the browser.
        </span>
      </div>
    </DashboardShell>
  );
}
