import { Link } from "wouter";
import { ArrowUpRight, MapPin, ShieldAlert } from "lucide-react";
import { formatNumber } from "./dashboard-shell";

export { InteractiveRiskMap as RiskMap } from "./leaflet-map";

const markerColor: Record<string, string> = {
  Red: "#b65343",
  Orange: "#cb7339",
  Yellow: "#d5a938",
  Green: "#4c806d",
};



export function PriorityList({
  villages
}: {
  villages: Array<{
    village_id: string;
    village_name: string;
    priority_score: number;
    priority_bucket: string;
    zone_color: string;
    population: number;
    landslide_probability?: number;
    awaiting_families_estimate?: number;
  }>;
}) {
  return (
    <div className="divide-y divide-[#e3ded4]">
      {villages.slice(0, 5).map((village, index) => {
        const mlProb = (village.landslide_probability ?? 0) * 100;
        return (
          <Link
            href={`/villages/${village.village_id}`}
            key={village.village_id}
            className="group flex items-center gap-3 py-3.5"
            data-testid={`link-priority-${village.village_id}`}
          >
            <span className="w-5 font-mono text-[10px] text-[#a5aaa6]">0{index + 1}</span>
            <span
              className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold"
              style={{
                background: `${markerColor[village.zone_color] ?? "#60717c"}22`,
                color: markerColor[village.zone_color] ?? "#60717c"
              }}
            >
              {village.village_name.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold group-hover:text-[#b65343]">
                {village.village_name}
              </span>
              <span className="font-mono text-[9px] tracking-[.05em] text-[#8a989a]">
                {formatNumber(village.population)} pop · ML Prob: {mlProb.toFixed(0)}%
                {village.awaiting_families_estimate ? ` · ~${village.awaiting_families_estimate} fams` : ""}
              </span>
            </span>
            <span className="text-right">
              <span className="block font-mono text-sm font-bold">{village.priority_score.toFixed(1)}</span>
              <span className="text-[9px] text-[#60717c]">{village.priority_bucket}</span>
            </span>
            <ArrowUpRight size={15} className="text-[#a5aaa6] group-hover:text-[#b65343]" />
          </Link>
        );
      })}
    </div>
  );
}

export function MetricBar({
  label,
  value,
  max = 100,
  color = "#3f7069"
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-[#60717c]">{label}</span>
          <span className="font-mono font-bold">{value.toFixed(1)}</span>
        </div>
      )}
      <div className="h-2 bg-[#e2ded3]">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function FacilityIcon({ type }: { type: string }) {
  return (
    <span className="grid h-9 w-9 place-items-center border border-[#d7d1c5] bg-[#f2eee4] text-[#3f7069]">
      <MapPin size={16} />
    </span>
  );
}
