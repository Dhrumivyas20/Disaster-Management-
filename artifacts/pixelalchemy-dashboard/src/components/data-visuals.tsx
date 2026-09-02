import { Link } from "wouter";
import { ArrowUpRight, Cpu, MapPin, Navigation, ShieldAlert, Waves } from "lucide-react";
import type { ZoneMarker } from "@workspace/api-client-react";
import { formatNumber } from "./dashboard-shell";

const markerPositions = [
  { left: "15%", top: "68%" }, { left: "28%", top: "43%" }, { left: "39%", top: "62%" }, { left: "48%", top: "24%" },
  { left: "57%", top: "49%" }, { left: "66%", top: "32%" }, { left: "76%", top: "67%" }, { left: "86%", top: "43%" },
  { left: "24%", top: "20%" }, { left: "72%", top: "18%" }, { left: "45%", top: "79%" }, { left: "91%", top: "78%" },
];

const markerColor: Record<string, string> = {
  Red: "#b65343",
  Orange: "#cb7339",
  Yellow: "#d5a938",
  Green: "#4c806d"
};

function getMarkerPosition(marker: ZoneMarker, index: number) {
  if (typeof marker.lat === "number" && typeof marker.lon === "number" && marker.lat > 0) {
    const minLat = 30.05;
    const maxLat = 30.78;
    const minLon = 78.50;
    const maxLon = 79.65;
    const topPct = 86 - ((marker.lat - minLat) / (maxLat - minLat)) * 72;
    const leftPct = 12 + ((marker.lon - minLon) / (maxLon - minLon)) * 76;
    const clampedTop = Math.max(10, Math.min(90, topPct));
    const clampedLeft = Math.max(8, Math.min(92, leftPct));
    return { left: `${clampedLeft.toFixed(1)}%`, top: `${clampedTop.toFixed(1)}%` };
  }
  return markerPositions[index % markerPositions.length];
}

export function RiskMap({
  zones,
  selectedId,
  onSelect
}: {
  zones: ZoneMarker[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="map-grid relative min-h-[380px] overflow-hidden border border-[#c9c9b9] p-4 md:min-h-[480px]" data-testid="map-risk-overview">
      <div className="relative z-10 flex items-start justify-between">
        <div className="bg-[#f2eee4]/95 px-3 py-1.5 border border-[#d7d1c5] shadow-xs">
          <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#60717c]">Multi-Hazard Risk Heatmap · Live Layer</p>
          <p className="mt-0.5 text-xs font-bold text-[#263440]">Rudraprayag & Chamoli, Uttarakhand</p>
        </div>
        <div className="flex gap-1 border border-[#c9c9b9] bg-[#f2eee4]/95 p-1 shadow-xs">
          {["Red", "Orange", "Yellow", "Green"].map((zone) => (
            <span key={zone} className="flex items-center gap-1 px-1.5 py-0.5 font-mono text-[9px] text-[#60717c]">
              <span className="h-2 w-2 rounded-full" style={{ background: markerColor[zone] }} />
              {zone[0]}
            </span>
          ))}
        </div>
      </div>
      
      {/* Topographic Contour Watermark Background */}
      <div className="absolute inset-0 z-[1] opacity-35 pointer-events-none">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <path d="M4 91 C18 76, 22 80, 34 62 S48 58, 56 38 S73 27, 95 5" fill="none" stroke="#3f7069" strokeWidth=".7" strokeDasharray="2 2" />
          <path d="M-4 23 C20 25, 35 7, 57 18 S75 47, 105 43" fill="none" stroke="#b65343" strokeWidth=".55" />
          <path d="M9 103 C28 83, 50 92, 61 69 S83 62, 101 73" fill="none" stroke="#3f7069" strokeWidth=".4" />
          <path d="M20 10 C45 35, 60 40, 85 80" fill="none" stroke="#60717c" strokeWidth=".3" strokeDasharray="1 3" />
        </svg>
      </div>

      {zones.map((marker, index) => {
        const position = getMarkerPosition(marker, index);
        const selected = selectedId === marker.village_id;
        const mlProb = (marker.landslide_probability ?? marker.landslide_ml_score ?? 0) * 100;
        const detScore = marker.deterministic_hazard_score ?? marker.hazard_score;
        return (
          <button
            key={marker.village_id}
            type="button"
            onClick={() => onSelect?.(marker.village_id)}
            className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left transition-transform duration-200 cursor-pointer ${
              selected ? "scale-125 z-30" : "hover:scale-115"
            }`}
            style={{ left: position.left, top: position.top }}
            data-testid={`button-map-marker-${marker.village_id}`}
            aria-label={`Village: ${marker.village_name}, Risk: ${marker.zone_color}`}
          >
            <span
              className={`marker-pulse block h-4 w-4 rounded-full border-2 border-[#f2eee4] shadow-sm ${
                marker.zone_color === "Red"
                  ? "bg-[#b65343]"
                  : marker.zone_color === "Orange"
                    ? "bg-[#cb7339]"
                    : marker.zone_color === "Yellow"
                      ? "bg-[#d5a938]"
                      : "bg-[#4c806d]"
              }`}
            />
            {selected && (
              <div className="absolute bottom-6 left-1/2 w-48 -translate-x-1/2 border border-[#3f7069] bg-[#fbf9f3] p-2.5 shadow-lg rounded-xs z-30 pointer-events-auto">
                <div className="flex items-center justify-between border-b border-[#e3ded4] pb-1.5">
                  <span className="truncate text-xs font-bold text-[#263440]">{marker.village_name}</span>
                  <span
                    className="font-mono text-[9px] font-bold px-1 py-0.5 rounded-xs"
                    style={{ background: `${markerColor[marker.zone_color]}22`, color: markerColor[marker.zone_color] }}
                  >
                    {marker.zone_color}
                  </span>
                </div>
                
                <div className="mt-2 space-y-1 font-mono text-[9px] text-[#60717c]">
                  <div className="flex justify-between">
                    <span>Deterministic Base:</span>
                    <b className="text-[#263440]">{detScore.toFixed(2)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>ML Landslide Prob:</span>
                    <b className="text-[#b65343]">{mlProb.toFixed(1)}%</b>
                  </div>
                  <div className="flex justify-between border-t border-[#e3ded4] pt-1 text-[#263440]">
                    <span>Final Risk Score:</span>
                    <b>{(marker.hazard_score * 100).toFixed(1)}%</b>
                  </div>
                  {marker.predicted_movement_type && (
                    <div className="mt-1 text-[8px] text-[#3f7069]">
                      Pattern: {marker.predicted_movement_type}
                    </div>
                  )}
                </div>

                <div className="mt-2 text-center border-t border-[#e3ded4] pt-1.5">
                  <span className="text-[9px] font-bold text-[#3f7069] hover:underline">
                    View Complete Record →
                  </span>
                </div>
              </div>
            )}
          </button>
        );
      })}
      
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-[#f2eee4]/95 px-2.5 py-1 font-mono text-[9px] text-[#60717c] border border-[#c9c9b9] shadow-xs">
        <Navigation size={11} /> NORTH UP · RISK FUSION (70% DET + 30% ML)
      </div>
    </div>
  );
}

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
