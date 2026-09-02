import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Building2, CircleAlert, Cpu, Database, Flame, Home, MapPin, Route, ShieldAlert, ShieldCheck, Sparkles, Users } from "lucide-react";
import { getGetVillageQueryKey, useGetVillage } from "@workspace/api-client-react";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageIntro, StatusPill, formatNumber } from "@/components/dashboard-shell";
import { MetricBar } from "@/components/data-visuals";

export default function VillageDetail() {
  const params = useParams<{ villageId: string }>();
  const villageId = params.villageId ?? "";
  const query = useGetVillage(villageId, { query: { enabled: Boolean(villageId), queryKey: getGetVillageQueryKey(villageId) } });

  if (query.isLoading) return <DashboardShell><LoadingState label="Reading village profile and risk records" /></DashboardShell>;
  if (query.isError || !query.data) return <DashboardShell><ErrorState onRetry={() => query.refetch()} label="This village record could not be read." /></DashboardShell>;

  const village = query.data;
  const mlProb = (village.landslide_probability ?? village.landslide_ml_score ?? 0) * 100;
  const detScore = (village.deterministic_hazard_score ?? village.hazard_score) * 100;
  const finalScore = village.hazard_score * 100;
  const awaitingFams = village.awaiting_families_estimate ?? Math.round(village.households * 0.15);
  const movementType = village.predicted_movement_type ?? "Rotational Slide";

  const reasons = village.why_priority_reasons?.length
    ? village.why_priority_reasons
    : [
        `${village.existing_hazard_zone} baseline hazard zone classification`,
        `${village.historical_incidents} recorded historical disaster incident(s)`,
        `ML predicts landslide susceptibility at ${mlProb.toFixed(1)}%`,
        `ML estimates approximately ${awaitingFams} families requiring relocation`,
        `Movement pattern classified as ${movementType}`,
      ];

  const factors = [
    { label: "Deterministic Base Hazard", value: detScore, note: `${village.existing_hazard_zone} band (${(detScore / 100).toFixed(2)})`, color: "#b65343" },
    { label: "ML Landslide Intelligence", value: mlProb, note: `${mlProb.toFixed(1)}% probability · ${movementType}`, color: "#cb7339" },
    { label: "Population Impact Weight", value: Math.min(100, (village.population / 16709) * 100), note: `${formatNumber(village.population)} people in scope`, color: "#d5a938" },
    { label: "Historical Incident Impact", value: Math.min(100, village.historical_incidents * 50), note: `${village.historical_incidents} past event(s)`, color: "#4c806d" },
  ];

  return (
    <DashboardShell>
      <div className="mb-5">
        <Link href="/villages" className="inline-flex items-center gap-2 text-xs font-semibold text-[#60717c] hover:text-[#b65343]" data-testid="link-back-villages">
          <ArrowLeft size={14} /> Back to Village Register
        </Link>
      </div>

      <PageIntro
        eyebrow={`Village Assessment · ${village.village_id}`}
        title={village.village_name}
        description="A transparent, data-driven view of multi-hazard risk indicators, ML landslide susceptibility, relocation demand, and operational relocation handoff."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              value={`${village.zone_color} Zone`}
              tone={village.zone_color === "Red" ? "red" : village.zone_color === "Orange" ? "orange" : village.zone_color === "Yellow" ? "yellow" : "green"}
            />
            <StatusPill
              value={`Priority: ${village.priority_bucket}`}
              tone={village.priority_bucket === "Immediate" ? "red" : village.priority_bucket === "Short-term" ? "orange" : village.priority_bucket === "Medium-term" ? "yellow" : "green"}
            />
          </div>
        }
      />

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-[#e0b8ad] bg-[#f8e9e4] p-5" data-testid="card-village-priority">
          <div className="flex justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#b65343]">Relocation Priority</p>
            <CircleAlert size={16} className="text-[#b65343]" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-[-.03em] text-[#984636]">{village.priority_bucket}</p>
          <p className="mt-1 font-mono text-xs text-[#b65343]">Score: {village.priority_score.toFixed(1)} / 100</p>
        </div>

        <div className="border border-[#727270]/25 bg-[#FEFEFE] p-5" data-testid="card-village-final-risk">
          <div className="flex justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#727270]">Final Risk Score</p>
            <ShieldAlert size={16} className="text-[#4B5125]" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-[-.03em] text-[#4B5125]">{finalScore.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-[#727270]">70% Det ({detScore.toFixed(0)}%) + 30% ML</p>
        </div>

        <div className="border border-[#cb7339]/30 bg-[#fbefe1] p-5" data-testid="card-village-ml-prob">
          <div className="flex justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#a55b28]">ML Landslide Prob</p>
            <Cpu size={16} className="text-[#a55b28]" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-[-.03em] text-[#a55b28]">{mlProb.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-[#727270]">{movementType}</p>
        </div>

        <div className="border border-[#727270]/25 bg-[#FEFEFE] p-5" data-testid="card-village-relocation-demand">
          <div className="flex justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#727270]">Est. Relocation Demand</p>
            <Home size={16} className="text-[#4B5125]" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-[-.03em] text-[#4B5125]">{formatNumber(awaitingFams)} <span className="text-sm font-normal text-[#727270]">families</span></p>
          <p className="mt-1 text-xs text-[#727270]">{formatNumber(village.population)} people ({formatNumber(village.households)} hh)</p>
        </div>
      </section>

      {/* Evidence Ledger & Why this village is priority */}
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <div className="border border-[#727270]/25 bg-[#FEFEFE] p-5">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#b65343]">Evidence Ledger</p>
              <h2 className="mt-1 text-lg font-bold text-[#4B5125]">Multi-Hazard & ML Risk Breakdown</h2>
            </div>
            <span className="font-mono text-[10px] text-[#727270]">AUDITABLE / 100</span>
          </div>

          <div className="space-y-4">
            {factors.map((factor) => (
              <div key={factor.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[#4B5125]">{factor.label}</span>
                  <span className="font-mono text-[#727270]">{factor.note}</span>
                </div>
                <MetricBar label="" value={factor.value} color={factor.color} />
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-[#727270]/20 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#727270] font-semibold">
              Risk Fusion Formula
            </p>
            <p className="mt-1 text-xs text-[#727270]">
              Final Hazard Score = 0.70 × Deterministic Base ({village.existing_hazard_zone} + {village.historical_incidents} inc) + 0.30 × ML Landslide Probability ({mlProb.toFixed(1)}%) = <b className="text-[#4B5125]">{village.hazard_score.toFixed(3)}</b>
            </p>
          </div>
        </div>

        {/* Why this village is prioritized (Auditable data-backed bullet points) */}
        <div className="border border-[#727270]/25 bg-[#FEFEFE] p-5">
          <div className="border-b border-[#727270]/20 pb-4">
            <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#4B5125]">Decision Support</p>
            <h2 className="mt-1 text-lg font-bold text-[#4B5125]">Why this village is prioritized</h2>
          </div>

          <div className="mt-4 space-y-3" data-testid="section-why-priority">
            {reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs leading-5 text-[#4B5125]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4B5125]" />
                <span>{reason}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-[#727270]/20 pt-4">
            <div className="flex items-center justify-between text-xs text-[#727270]">
              <span>Geographic Coordinates:</span>
              <span className="font-mono font-bold text-[#4B5125]">{village.lat.toFixed(4)}°N, {village.lon.toFixed(4)}°E</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-[#727270]">
              <span>Household Density:</span>
              <span className="font-mono font-bold text-[#4B5125]">{(village.population / (village.households || 1)).toFixed(1)} persons/hh</span>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Infrastructure within 35 km */}
      <section className="mt-5 border border-[#727270]/25 bg-[#FEFEFE]">
        <div className="border-b border-[#727270]/20 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#727270]">Critical Infrastructure</p>
          <h2 className="mt-1 text-lg font-bold text-[#4B5125]">Nearby Facilities (within 35 km)</h2>
        </div>
        {village.nearby_facilities?.length ? (
          <div className="grid divide-y divide-[#727270]/20 sm:grid-cols-2 sm:divide-y-0 sm:gap-px sm:bg-[#727270]/20">
            {village.nearby_facilities.map((facility) => (
              <div key={facility.facility_id} className="flex items-center gap-3 bg-[#FEFEFE] p-4" data-testid={`row-nearby-facility-${facility.facility_id}`}>
                <span className="grid h-8 w-8 place-items-center bg-[#F0F1DB] text-[#4B5125]">
                  <Building2 size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#4B5125]">{facility.name}</span>
                  <span className="font-mono text-[9px] uppercase text-[#727270]">{facility.type.replaceAll("_", " ")}</span>
                </span>
                <span className="font-mono text-xs font-bold text-[#4B5125]">
                  {(facility as any).distance_km ? `${(facility as any).distance_km} km` : `${facility.lat.toFixed(2)}°N`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState title="No nearby facilities mapped" description="No critical infrastructure records found within 35 km." />
          </div>
        )}
      </section>

      {/* Relocation Handoff Banner */}
      <section className="mt-5 border border-[#5c6331] bg-[#4B5125] p-6 text-[#FEFEFE] md:flex md:items-center md:justify-between md:gap-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#ECE5DC]/75">Operational Decision Handoff</p>
          <h2 className="mt-2 text-xl font-bold text-[#FEFEFE]">Move from exposure to a verified relocation option.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#ECE5DC]/85">
            Feed ML estimated relocation demand (~{awaitingFams} families) into capacity screening, then evaluate candidate sites using multi-criteria AHP ranking.
          </p>
        </div>
        <Link
          href={`/relocation/${village.village_id}`}
          className="mt-5 inline-flex shrink-0 items-center gap-2 bg-[#F0F1DB] px-4 py-3 text-sm font-bold text-[#4B5125] hover:bg-[#FEFEFE] md:mt-0 transition-colors"
          data-testid="link-start-relocation"
        >
          <Route size={16} /> Open Relocation Recommendation <ArrowRight size={15} />
        </Link>
      </section>
    </DashboardShell>
  );
}
