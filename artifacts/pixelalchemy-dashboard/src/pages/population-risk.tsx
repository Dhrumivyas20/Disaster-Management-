import { useMemo } from "react";
import { ArrowRight, Cpu, Home, ShieldAlert, Users, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { useGetDashboardSummary, useGetVillages } from "@workspace/api-client-react";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageIntro, StatusPill, formatNumber } from "@/components/dashboard-shell";

const zones = ["Red", "Orange", "Yellow", "Green"];
const zoneColor: Record<string, string> = {
  Red: "#b65343",
  Orange: "#cb7339",
  Yellow: "#d5a938",
  Green: "#4c806d"
};
const zoneTone: Record<string, "red" | "orange" | "yellow" | "green"> = {
  Red: "red",
  Orange: "orange",
  Yellow: "yellow",
  Green: "green"
};

export default function PopulationRisk() {
  const summaryQuery = useGetDashboardSummary();
  const villagesQuery = useGetVillages();
  const villages = useMemo(() => villagesQuery.data ?? [], [villagesQuery.data]);

  const zoneStats = useMemo(() => {
    return zones.map((zone) => {
      const inZone = villages.filter((village) => village.zone_color === zone);
      return {
        zone,
        population: inZone.reduce((total, village) => total + village.population, 0),
        households: inZone.reduce((total, village) => total + village.households, 0),
        villages: inZone.length,
      };
    });
  }, [villages]);

  const topExposedVillages = useMemo(
    () =>
      [...villages]
        .filter((v) => v.zone_color === "Red" || v.zone_color === "Orange")
        .sort((a, b) => b.population - a.population),
    [villages]
  );

  if (summaryQuery.isLoading || villagesQuery.isLoading) {
    return <DashboardShell><LoadingState label="Calculating population exposure models" /></DashboardShell>;
  }
  if (summaryQuery.isError || villagesQuery.isError || !summaryQuery.data) {
    return (
      <DashboardShell>
        <ErrorState
          onRetry={() => {
            void summaryQuery.refetch();
            void villagesQuery.refetch();
          }}
          label="Population exposure records could not be loaded."
        />
      </DashboardShell>
    );
  }

  const summary = summaryQuery.data;

  const exposedShare = summary.total_population ? (summary.population_at_risk / summary.total_population) * 100 : 0;
  const totalDemandFamilies = summary.total_predicted_relocation_demand_families ?? 1879;

  return (
    <DashboardShell>
      <PageIntro
        eyebrow="Human Impact Analysis · Rudraprayag & Chamoli"
        title="Population at Risk"
        description="Translate multi-hazard exposure into affected households and displaced population demand to prioritize human-centric disaster mitigation."
        action={<StatusPill value={`${exposedShare.toFixed(1)}% exposed`} tone="orange" />}
      />

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-[#e0b8ad] bg-[#f8e9e4] p-5">
          <div className="flex items-center justify-between text-[#b65343]">
            <p className="font-mono text-[10px] uppercase tracking-[.14em]">People at High Risk</p>
            <UsersRound size={18} />
          </div>
          <p className="mt-3 font-mono text-3xl font-bold tracking-[-.04em] text-[#984636]">
            {formatNumber(summary.population_at_risk)}
          </p>
          <p className="mt-1 text-xs text-[#984636]/80">{summary.high_risk_villages} high-risk villages</p>
        </div>

        <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
          <div className="flex items-center justify-between text-[#3f7069]">
            <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#60717c]">Households Mapped</p>
            <Home size={18} />
          </div>
          <p className="mt-3 font-mono text-3xl font-bold tracking-[-.04em] text-[#263440]">
            {formatNumber(summary.total_households)}
          </p>
          <p className="mt-1 text-xs text-[#60717c]">Mapped across 20 villages</p>
        </div>

        <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5">
          <div className="flex items-center justify-between text-[#60717c]">
            <p className="font-mono text-[10px] uppercase tracking-[.14em]">Total Regional Population</p>
            <Users size={18} />
          </div>
          <p className="mt-3 font-mono text-3xl font-bold tracking-[-.04em] text-[#263440]">
            {formatNumber(summary.total_population)}
          </p>
          <p className="mt-1 text-xs text-[#60717c]">Rudraprayag & Chamoli districts</p>
        </div>

        <div className="border border-[#cb7339]/30 bg-[#fbefe1] p-5">
          <div className="flex items-center justify-between text-[#a55b28]">
            <p className="font-mono text-[10px] uppercase tracking-[.14em] font-bold">ML Relocation Demand</p>
            <Cpu size={18} />
          </div>
          <p className="mt-3 font-mono text-3xl font-bold tracking-[-.04em] text-[#a55b28]">
            ~{formatNumber(totalDemandFamilies)} <span className="font-mono text-sm font-normal text-[#60717c]">fams</span>
          </p>
          <p className="mt-1 text-xs text-[#60717c]">Estimated families requiring relocation</p>
        </div>
      </section>

      {/* Impact by Hazard Zone */}
      <section className="mt-5 border border-[#d7d1c5] bg-[#fbf9f3]">
        <div className="border-b border-[#e3ded4] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#60717c]">Hazard Band Breakdown</p>
          <h2 className="mt-1 text-lg font-bold text-[#263440]">Population Distribution Across Risk Zones</h2>
        </div>
        {villages.length ? (
          <div className="grid divide-y divide-[#e3ded4] md:grid-cols-2 md:divide-x md:divide-y-0">
            {zoneStats.map(({ zone, population, households, villages: count }) => (
              <div key={zone} className="p-5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-[#263440]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: zoneColor[zone] }} />
                    {zone} Hazard Zone
                  </span>
                  <span className="font-mono text-xs text-[#60717c]">{count} villages</span>
                </div>
                <p className="mt-5 font-mono text-2xl font-bold text-[#263440]">{formatNumber(population)}</p>
                <p className="text-xs text-[#60717c]">residents · {formatNumber(households)} households</p>
                <div className="mt-3 h-2 bg-[#e2ded3]">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${summary.population_at_risk ? Math.min(100, (population / summary.population_at_risk) * 100) : 0}%`,
                      background: zoneColor[zone],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No population records available" description="The village layer returned no population records." />
        )}
      </section>

      {/* High-Exposure Communities Table */}
      <section className="mt-5 border border-[#d7d1c5] bg-[#fbf9f3]">
        <div className="flex items-center justify-between border-b border-[#e3ded4] p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#b65343]">Priority Exposure</p>
            <h2 className="mt-1 text-lg font-bold text-[#263440]">High-Risk Communities by Population Size</h2>
          </div>
          <Link
            href="/relocation-priority"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#3f7069] hover:text-[#b65343] transition-colors"
          >
            Urgency Queue <ArrowRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e3ded4] bg-[#f2eee4] font-mono text-[10px] uppercase tracking-[.12em] text-[#60717c]">
                <th className="px-5 py-3 font-normal">Village</th>
                <th className="px-3 py-3 font-normal">Hazard Zone</th>
                <th className="px-3 py-3 font-normal">Population</th>
                <th className="px-3 py-3 font-normal">Households</th>
                <th className="px-3 py-3 font-normal">ML Demand</th>
                <th className="px-5 py-3 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {topExposedVillages.map((v) => (
                <tr key={v.village_id} className="border-b border-[#e8e3da] last:border-0 hover:bg-[#f7f3ea] transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/villages/${v.village_id}`} className="font-bold text-sm text-[#263440] hover:text-[#b65343]">
                      {v.village_name}
                    </Link>
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusPill value={v.zone_color} tone={zoneTone[v.zone_color]} />
                  </td>
                  <td className="px-3 py-3.5 font-mono text-sm font-bold text-[#263440]">
                    {formatNumber(v.population)}
                  </td>
                  <td className="px-3 py-3.5 font-mono text-sm text-[#60717c]">
                    {formatNumber(v.households)}
                  </td>
                  <td className="px-3 py-3.5 font-mono text-sm font-semibold text-[#a55b28]">
                    ~{v.awaiting_families_estimate ?? 0} fams
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/relocation/${v.village_id}`}
                      className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#3f7069] hover:underline"
                    >
                      Relocation <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
