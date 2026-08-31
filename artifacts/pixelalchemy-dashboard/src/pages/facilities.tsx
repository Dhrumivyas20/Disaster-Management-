import { useMemo, useState } from "react";
import { Building2, Droplets, GraduationCap, Hospital, MapPin } from "lucide-react";
import { useGetFacilities, type GetFacilitiesParams } from "@workspace/api-client-react";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageIntro } from "@/components/dashboard-shell";

const types = [{ value: "all", label: "All facilities" }, { value: "hospital", label: "Hospitals" }, { value: "school", label: "Schools" }, { value: "water_source", label: "Water sources" }];
const iconMap = { hospital: Hospital, school: GraduationCap, water_source: Droplets };

export default function Facilities() {
  const [type, setType] = useState("all");
  const params = useMemo<GetFacilitiesParams>(() => ({ type: type === "all" ? undefined : type as GetFacilitiesParams["type"] }), [type]);
  const query = useGetFacilities(params);
  if (query.isLoading) return <DashboardShell><LoadingState label="Reading critical facility register" /></DashboardShell>;
  if (query.isError) return <DashboardShell><ErrorState onRetry={() => query.refetch()} label="The facility register could not be loaded." /></DashboardShell>;
  const facilities = query.data ?? [];
  return <DashboardShell><PageIntro eyebrow="Reference layer · critical infrastructure" title="Facilities" description="A location register for the services communities depend on during hazard assessment and relocation planning." action={<span className="font-mono text-[10px] uppercase tracking-[.14em] text-[#60717c]">{facilities.length} mapped facilities</span>} />
    <section className="mb-5 flex flex-wrap items-center gap-2" aria-label="Facility filters"><span className="mr-2 font-mono text-[10px] uppercase tracking-[.13em] text-[#60717c]">Show</span>{types.map((item) => <button type="button" key={item.value} onClick={() => setType(item.value)} className={`border px-3 py-2 text-xs font-semibold ${type === item.value ? "border-[#263440] bg-[#263440] text-[#f2eee4]" : "border-[#d7d1c5] bg-[#fbf9f3] text-[#60717c] hover:border-[#3f7069] hover:text-[#3f7069]"}`} data-testid={`button-filter-${item.value}`}>{item.label}</button>)}</section>
    {facilities.length === 0 ? <EmptyState title="No facilities in this view" description="Try the all facilities filter to restore the full reference layer." /> : <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{facilities.map((facility) => { const Icon = iconMap[facility.type] ?? Building2; return <article key={facility.facility_id} className="group border border-[#d7d1c5] bg-[#fbf9f3] p-5 hover:border-[#3f7069]" data-testid={`card-facility-${facility.facility_id}`}><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center bg-[#e0ebe7] text-[#3f7069]"><Icon size={19} /></span><span className="font-mono text-[9px] uppercase tracking-[.1em] text-[#8a989a]">{facility.type.replaceAll("_", " ")}</span></div><h2 className="mt-5 text-base font-bold">{facility.name}</h2><div className="mt-4 flex items-center gap-2 border-t border-[#e8e3da] pt-3 font-mono text-[10px] text-[#60717c]"><MapPin size={12} className="text-[#b65343]" />{facility.lat.toFixed(4)}° N <span className="text-[#c4c1b8]">/</span> {facility.lon.toFixed(4)}° E</div></article> })}</section>}
  </DashboardShell>;
}
