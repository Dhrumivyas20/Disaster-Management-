import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CalendarDays, ChevronRight, ShieldCheck, Users } from "lucide-react";
import { useGetDashboardSummary, useGetPriority, useGetZones } from "@workspace/api-client-react";
import { DashboardShell, ErrorState, LoadingState, PageIntro, StatusPill, formatNumber } from "@/components/dashboard-shell";
import { MetricBar, PriorityList, RiskMap } from "@/components/data-visuals";

export default function Dashboard() {
  const [selectedMarker, setSelectedMarker] = useState<string>();
  const summaryQuery = useGetDashboardSummary();
  const zonesQuery = useGetZones();
  const priorityQuery = useGetPriority();
  if (summaryQuery.isLoading) return <DashboardShell><LoadingState /></DashboardShell>;
  if (summaryQuery.isError || !summaryQuery.data) return <DashboardShell><ErrorState onRetry={() => summaryQuery.refetch()} /></DashboardShell>;
  const summary = summaryQuery.data;
  const zones = zonesQuery.data ?? [];
  const priorities = priorityQuery.data ?? [];
  const zoneOrder = ["Red", "Orange", "Yellow", "Green"];
  return (
    <DashboardShell>
      <PageIntro eyebrow="Situation report · 18 June 2024 / 06:42 IST" title="Protective action, made legible." description={`A live view of community exposure across ${summary.region}. Start with the villages that need a decision today.`} action={<div className="flex items-center gap-2 text-xs text-[#60717c]"><span className="h-2 w-2 rounded-full bg-[#4c806d]" /><span>Layer current</span><span className="font-mono text-[10px]">06:42:17</span></div>} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Regional summary">
        {[
          { label: "Communities tracked", value: formatNumber(summary.total_villages), detail: "across two districts", icon: ShieldCheck },
          { label: "People exposed", value: formatNumber(summary.population_at_risk), detail: `${summary.high_risk_villages} high-risk villages`, icon: Users, alert: true },
          { label: "Immediate priority", value: formatNumber(summary.immediate_priority), detail: "requires action planning", icon: CalendarDays, alert: true },
          { label: "Households mapped", value: formatNumber(summary.total_households), detail: `${formatNumber(summary.total_population)} total people`, icon: ShieldCheck },
        ].map(({ label, value, detail, icon: Icon, alert }) => <div key={label} className={`border p-5 ${alert ? "border-[#e0b8ad] bg-[#f8e9e4]" : "border-[#d7d1c5] bg-[#fbf9f3]"}`} data-testid={`card-summary-${label.toLowerCase().replaceAll(" ", "-")}`}><div className="flex items-start justify-between"><p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#60717c]">{label}</p><Icon size={17} className={alert ? "text-[#b65343]" : "text-[#3f7069"} /></div><p className="mt-3 text-3xl font-bold tracking-[-.04em]">{value}</p><p className="mt-1 text-xs text-[#60717c]">{detail}</p></div>)}
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
        <div className="border border-[#d7d1c5] bg-[#fbf9f3]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3ded4] px-5 py-4"><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#60717c]">Spatial view</p><h2 className="mt-1 text-base font-bold">Village exposure by zone</h2></div><Link href="/villages" className="flex items-center gap-1 text-xs font-semibold text-[#3f7069] hover:text-[#b65343]" data-testid="link-open-villages">Open village list <ArrowRight size={14} /></Link></div>
          <RiskMap zones={zones} selectedId={selectedMarker} onSelect={setSelectedMarker} />
          <div className="grid grid-cols-4 border-t border-[#e3ded4]">{zoneOrder.map((zone) => <div key={zone} className="border-r border-[#e3ded4] px-4 py-3 last:border-r-0"><p className="font-mono text-[10px] uppercase text-[#8a989a]">{zone}</p><p className="mt-1 text-lg font-bold">{summary.zone_counts[zone] ?? 0}</p></div>)}</div>
        </div>
        <div className="border border-[#d7d1c5] bg-[#fbf9f3]"><div className="flex items-center justify-between border-b border-[#e3ded4] px-5 py-4"><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#b65343]">Action queue</p><h2 className="mt-1 text-base font-bold">Priority villages</h2></div><Link href="/villages" className="grid h-7 w-7 place-items-center border border-[#d7d1c5] text-[#60717c] hover:border-[#3f7069] hover:text-[#3f7069]" aria-label="View all priority villages" data-testid="link-all-priority"><ChevronRight size={15} /></Link></div><div className="px-5"><PriorityList villages={priorities} /></div></div>
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5"><div className="mb-5 flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#60717c]">Priority mix</p><h2 className="mt-1 text-base font-bold">How urgency is distributed</h2></div><StatusPill value="Explainable" tone="green" /></div><div className="space-y-4">{["Immediate", "Short-term", "Medium-term", "Monitor"].map((key) => <MetricBar key={key} label={key} value={summary.priority_counts[key] ?? 0} max={Math.max(...Object.values(summary.priority_counts), 1)} color={key === "Immediate" ? "#b65343" : key === "Short-term" ? "#cb7339" : key === "Medium-term" ? "#d5a938" : "#4c806d"} />)}</div></div>
        <div className="border border-[#d7d1c5] bg-[#263440] p-5 text-[#f2eee4]"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#aeb8b6]">Decision note</p><h2 className="mt-1 text-base font-bold">Every score has a reason.</h2></div><span className="grid h-8 w-8 place-items-center bg-[#e8b84c] text-[#263440]"><ShieldCheck size={16} /></span></div><p className="mt-7 max-w-lg text-xl leading-8 tracking-[-.02em] text-[#f2eee4]">Risk scores combine hazard exposure, population impact, and incident history. Relocation matches add capacity and access — not guesswork.</p><Link href="/villages" className="mt-7 inline-flex items-center gap-2 border border-[#718087] px-4 py-2.5 text-sm font-semibold hover:border-[#e8b84c] hover:text-[#f7d884]" data-testid="link-review-method">Review village priorities <ArrowRight size={15} /></Link></div>
      </section>
    </DashboardShell>
  );
}
