import type { Village } from "@workspace/api-client-react";
import { formatNumber } from "@/components/dashboard-shell";

export function SourceVillagePicker({ villages, selectedId, onChange }: { villages: Village[]; selectedId: string; onChange: (id: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[.14em] text-[#60717c]">Source village</span>
      <select value={selectedId} onChange={(event) => onChange(event.target.value)} className="h-11 w-full border border-[#d7d1c5] bg-[#fbf9f3] px-3 text-sm font-semibold text-[#263440] outline-none focus:border-[#3f7069]" aria-label="Select source village" data-testid="select-source-village">
        {villages.length === 0 && <option value="">No villages available</option>}
        {villages.map((village) => <option key={village.village_id} value={village.village_id}>{village.village_name} · {village.priority_bucket}</option>)}
      </select>
    </label>
  );
}

export function DistanceStat({ label, value }: { label: string; value: number }) {
  return <div><p className="font-mono text-[9px] uppercase tracking-[.08em] text-[#8a989a]">{label}</p><p className="mt-1 font-mono text-sm font-bold">{value.toFixed(1)} km</p></div>;
}

export function CapacityStat({ available, total }: { available: number; total: number }) {
  const percentage = total > 0 ? Math.round((available / total) * 100) : 0;
  return <div><p className="font-mono text-[9px] uppercase tracking-[.08em] text-[#8a989a]">Available capacity</p><p className="mt-1 font-mono text-sm font-bold">{formatNumber(available)} <span className="font-normal text-[#8a989a]">/ {formatNumber(total)}</span></p><div className="mt-2 h-1.5 bg-[#e2ded3]"><div className="h-full bg-[#3f7069]" style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} /></div></div>;
}
