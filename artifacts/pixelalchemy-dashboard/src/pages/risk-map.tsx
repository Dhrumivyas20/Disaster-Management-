import { useState } from "react";
import { ArrowRight, CircleHelp, Layers3, MapPinned } from "lucide-react";
import { Link } from "wouter";
import { useGetDashboardSummary, useGetZones } from "@workspace/api-client-react";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageIntro, StatusPill, formatNumber } from "@/components/dashboard-shell";
import { RiskMap } from "@/components/data-visuals";
import { MAP_PROVIDER } from "@/lib/map-provider";

export default function RiskMapPage() {
  const [selectedMarker, setSelectedMarker] = useState<string>();
  const summaryQuery = useGetDashboardSummary();
  const zonesQuery = useGetZones();
  if (summaryQuery.isLoading || zonesQuery.isLoading) return <DashboardShell><LoadingState label="Loading full risk map" /></DashboardShell>;
  if (summaryQuery.isError || zonesQuery.isError || !summaryQuery.data) return <DashboardShell><ErrorState onRetry={() => { void summaryQuery.refetch(); void zonesQuery.refetch(); }} label="The full risk map could not be loaded." /></DashboardShell>;
  const summary = summaryQuery.data;
  const zones = zonesQuery.data ?? [];
  const selected = zones.find((zone) => zone.village_id === selectedMarker);
  return <DashboardShell>
    <PageIntro eyebrow="Spatial command view · live village layer" title="Risk map" description="Read the whole operating area at once, then select a village point to carry its exposure into a record." action={<StatusPill value={`${zones.length} points live`} tone="green" />} />
    <section className="grid gap-4 md:grid-cols-3">
      <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#60717c]">Total population</p><p className="mt-3 text-3xl font-bold">{formatNumber(summary.total_population)}</p><p className="mt-1 text-xs text-[#60717c]">Across {summary.region}</p></div>
      <div className="border border-[#e0b8ad] bg-[#f8e9e4] p-5"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#b65343]">Population at risk</p><p className="mt-3 text-3xl font-bold text-[#984636]">{formatNumber(summary.population_at_risk)}</p><p className="mt-1 text-xs text-[#984636]/75">{summary.high_risk_villages} high-risk villages</p></div>
      <div className="border border-[#d7d1c5] bg-[#fbf9f3] p-5"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#60717c]">Map interaction</p><p className="mt-3 text-lg font-bold">{selected ? selected.village_name : "Select a marker"}</p><p className="mt-1 text-xs text-[#60717c]">{selected ? `${selected.hazard_score.toFixed(1)} hazard score · ${formatNumber(selected.population)} people` : "Points are positioned for orientation, not navigation."}</p></div>
    </section>
    <section className="mt-5 border border-[#d7d1c5] bg-[#fbf9f3]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3ded4] px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center bg-[#e0ebe7] text-[#3f7069]"><MapPinned size={16} /></span><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#60717c]">Orientation layer</p><h2 className="mt-1 text-base font-bold">Exposure across the operating area</h2></div></div><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#60717c]">Click any point for detail</span></div>{zones.length ? <RiskMap zones={zones} selectedId={selectedMarker} onSelect={setSelectedMarker} /> : <div className="p-5"><EmptyState title="No village points available" description="The live zones layer returned no points for this map view." /></div>}</section>
    {selected && <div className="mt-4 flex flex-col justify-between gap-3 border border-[#3f7069] bg-[#e0ebe7] p-4 sm:flex-row sm:items-center"><div><p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#3f7069]">Selected point</p><p className="mt-1 text-sm font-bold">{selected.village_name} <span className="ml-2 font-mono text-xs font-normal text-[#60717c]">{selected.zone_color} zone</span></p></div><Link href={`/villages/${selected.village_id}`} className="inline-flex items-center gap-2 text-xs font-bold text-[#3f7069] hover:text-[#b65343]" data-testid="link-selected-village-detail">Open village record <ArrowRight size={14} /></Link></div>}
    <section className="mt-5 flex flex-col gap-4 border border-[#d7d1c5] bg-[#f7f3ea] p-5 md:flex-row md:items-start"><Layers3 size={18} className="shrink-0 text-[#3f7069]" /><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-bold">Map provider: {MAP_PROVIDER.name}</h2><StatusPill value={MAP_PROVIDER.mode === "sample" ? "Fallback active" : "Configured"} tone={MAP_PROVIDER.mode === "sample" ? "yellow" : "green"} /></div><p className="mt-2 max-w-3xl text-xs leading-5 text-[#60717c]">{MAP_PROVIDER.mode === "sample" ? "A local orientation layer is active. Village points and exposure data remain live." : "A custom map provider is configured for this workspace."} Replace the tile adapter in <span className="font-mono text-[10px]">{`src/lib/map-provider.ts`}</span> when the district map key is ready.</p></div><CircleHelp size={16} className="ml-auto shrink-0 text-[#8a989a]" /></section>
  </DashboardShell>;
}
