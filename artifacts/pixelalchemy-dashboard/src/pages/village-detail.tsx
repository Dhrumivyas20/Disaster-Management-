import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Building2, CircleAlert, MapPin, Route, ShieldCheck } from "lucide-react";
import { getGetVillageQueryKey, useGetVillage } from "@workspace/api-client-react";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageIntro, StatusPill, formatKey, formatNumber } from "@/components/dashboard-shell";
import { MetricBar } from "@/components/data-visuals";

export default function VillageDetail() {
  const params = useParams<{ villageId: string }>();
  const villageId = params.villageId ?? "";
  const query = useGetVillage(villageId, { query: { enabled: Boolean(villageId), queryKey: getGetVillageQueryKey(villageId) } });
  if (query.isLoading) return <DashboardShell><LoadingState label="Reading village record" /></DashboardShell>;
  if (query.isError || !query.data) return <DashboardShell><ErrorState onRetry={() => query.refetch()} label="This village record could not be read." /></DashboardShell>;
  const village = query.data;
  const factors = [
    { label: "Hazard exposure", value: village.hazard_score, note: "Current zone assessment", color: "#b65343" },
    { label: "Population impact", value: Math.min(100, village.population / 12), note: `${formatNumber(village.population)} people in scope`, color: "#cb7339" },
    { label: "Historical incidents", value: Math.min(100, village.historical_incidents * 12), note: `${village.historical_incidents} recorded incidents`, color: "#d5a938" },
  ];
  return <DashboardShell>
    <div className="mb-5"><Link href="/villages" className="inline-flex items-center gap-2 text-xs font-semibold text-[#60717c] hover:text-[#b65343]" data-testid="link-back-villages"><ArrowLeft size={14} />All villages</Link></div>
    <PageIntro eyebrow={`Village record · ${village.village_id}`} title={village.village_name} description="A transparent view of the exposure signals behind this village's priority, plus the next operational handoff." action={<StatusPill value={village.priority_bucket} tone={village.priority_bucket === "Immediate" ? "red" : village.priority_bucket === "Short-term" ? "orange" : village.priority_bucket === "Medium-term" ? "yellow" : "green"} />} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "Priority score", value: village.priority_score.toFixed(1), note: "Composite / 100", icon: CircleAlert, alert: true },
        { label: "Hazard score", value: village.hazard_score.toFixed(1), note: `${village.existing_hazard_zone} exposure band`, icon: ShieldCheck },
        { label: "Population", value: formatNumber(village.population), note: `${formatNumber(village.households)} households`, icon: Building2 },
        { label: "Coordinates", value: `${village.lat.toFixed(3)}°`, note: `${village.lon.toFixed(3)}° E`, icon: MapPin },
      ].map(({ label, value, note, icon: Icon, alert }) => <div key={label} className={`border p-5 ${alert ? "border-[#e0b8ad] bg-[#f8e9e4]" : "border-[#d7d1c5] bg-[#fbf9f3]"}`} data-testid={`card-village-${label.toLowerCase().replaceAll(" ", "-")}`}><div className="flex justify-between"><p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#60717c]">{label}</p><Icon size={16} className={alert ? "text-[#b65343]" : "text-[#3f7069"} /></div><p className="mt-3 text-2xl font-bold tracking-[-.03em]">{value}</p><p className="mt-1 text-xs text-[#60717c]">{note}</p></div>)}
    </section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5"><div className="mb-6 flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#b65343]">Evidence ledger</p><h2 className="mt-1 text-lg font-bold">Why this village is prioritized</h2></div><span className="font-mono text-[10px] text-[#60717c]">SCORE / 100</span></div><div className="space-y-5">{factors.map((factor) => <MetricBar key={factor.label} label={factor.label} value={factor.value} color={factor.color} />)}<div className="mt-6 border-t border-[#e3ded4] pt-4"><p className="text-xs leading-5 text-[#60717c]">Signals are shown independently so an administrator can challenge, contextualize, or carry this record into a relocation conversation.</p></div></div></div>
      <div className="border border-[#d7d1c5] bg-[#fbf9f3]"><div className="border-b border-[#e3ded4] p-5"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#60717c]">Nearby support</p><h2 className="mt-1 text-lg font-bold">Facilities in the area</h2></div>{village.nearby_facilities?.length ? <div className="divide-y divide-[#e3ded4]">{village.nearby_facilities.map((facility) => <div key={facility.facility_id} className="flex items-center gap-3 px-5 py-4" data-testid={`row-nearby-facility-${facility.facility_id}`}><span className="grid h-8 w-8 place-items-center bg-[#e0ebe7] text-[#3f7069]"><Building2 size={15} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{facility.name}</span><span className="font-mono text-[9px] uppercase text-[#8a989a]">{facility.type.replaceAll("_", " ")}</span></span><span className="font-mono text-[10px] text-[#60717c]">{facility.lat.toFixed(2)}°</span></div>)}</div> : <div className="p-5"><EmptyState title="No nearby facilities listed" description="The regional reference layer has no facility records for this village." /></div>}</div>
    </section>
    <section className="mt-5 border border-[#2f4a4d] bg-[#3f7069] p-6 text-[#f2eee4] md:flex md:items-center md:justify-between md:gap-8"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#c2d6cd]">Operational handoff</p><h2 className="mt-2 text-xl font-bold">Move from exposure to a verified relocation option.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#d5e2dc]">Review ranked sites against capacity, access, water, and healthcare distance before convening the village team.</p></div><Link href={`/relocation/${village.village_id}`} className="mt-5 inline-flex shrink-0 items-center gap-2 bg-[#e8b84c] px-4 py-3 text-sm font-bold text-[#263440] hover:bg-[#f7d884] md:mt-0" data-testid="link-start-relocation"><Route size={16} />Open relocation handoff <ArrowRight size={15} /></Link></section>
  </DashboardShell>;
}
