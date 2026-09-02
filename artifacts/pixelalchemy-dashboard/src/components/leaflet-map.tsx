import { useEffect, useRef, useState } from "react";
import type { ZoneMarker } from "@workspace/api-client-react";
import { MAP_PROVIDER } from "@/lib/map-provider";
import { Layers, Maximize2, Minimize2, Mountain, Navigation2, Satellite, Trees } from "lucide-react";

declare const L: any;

const ZONE_COLORS: Record<string, string> = {
  Red: "#b65343",
  Orange: "#cb7339",
  Yellow: "#d5a938",
  Green: "#4c806d",
};

const CANDIDATE_SITES = [
  { site_id: "S001", site_name: "Gauchar Plain", lat: 30.2760, lon: 79.3110 },
  { site_id: "S002", site_name: "Dewalgarh", lat: 30.3400, lon: 79.2500 },
  { site_id: "S003", site_name: "Simli", lat: 30.3600, lon: 79.2900 },
  { site_id: "S004", site_name: "Chamoli Outskirts", lat: 30.4100, lon: 79.3300 },
  { site_id: "S005", site_name: "Kirtinagar", lat: 30.1700, lon: 78.7500 },
  { site_id: "S006", site_name: "Srinagar Outskirts", lat: 30.2222, lon: 78.7800 },
  { site_id: "S007", site_name: "Rudraprayag Outskirts", lat: 30.3000, lon: 78.9500 },
  { site_id: "S008", site_name: "Guptkashi Lower Belt", lat: 30.5200, lon: 79.0700 },
  { site_id: "S009", site_name: "Pauri Outskirts", lat: 30.1469, lon: 78.7810 },
  { site_id: "S010", site_name: "Tehri Resettlement Zone", lat: 30.3800, lon: 78.4800 },
];

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findBestSafeSite(village: { lat: number; lon: number }) {
  let best = CANDIDATE_SITES[0];
  let minDistance = Infinity;

  CANDIDATE_SITES.forEach((site) => {
    const d = getDistanceKm(village.lat, village.lon, site.lat, site.lon);
    if (d < minDistance) {
      minDistance = d;
      best = site;
    }
  });

  return { site: best, distance: minDistance };
}

export type MapStyleKey = "topo-v2" | "satellite" | "outdoor-v2" | "streets-v2";

const MAP_STYLES: { id: MapStyleKey; label: string; icon: typeof Mountain }[] = [
  { id: "topo-v2", label: "Topo", icon: Mountain },
  { id: "streets-v2", label: "Streets", icon: Layers },
  { id: "satellite", label: "Satellite", icon: Satellite },
  { id: "outdoor-v2", label: "Terrain", icon: Trees },
];

function getTileUrl(style: MapStyleKey, apiKey?: string) {
  if (apiKey) {
    const ext = style === "satellite" ? "jpg" : "png";
    return `https://api.maptiler.com/maps/${style}/{z}/{x}/{y}.${ext}?key=${apiKey}`;
  }
  return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
}

export function InteractiveRiskMap({
  zones,
  selectedId,
  onSelect,
  className,
}: {
  zones: ZoneMarker[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  const [currentStyle, setCurrentStyle] = useState<MapStyleKey>(
    (MAP_PROVIDER.style as MapStyleKey) || "topo-v2",
  );
  const [isReady, setIsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-resize map tiles on fullscreen toggle
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);

  // Escape key to exit fullscreen
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    function initMap() {
      if (typeof L === "undefined") {
        setTimeout(initMap, 100);
        return;
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current, {
        center: [30.45, 79.25],
        zoom: 9.5,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomleft" }).addTo(map);

      L.control
        .attribution({
          position: "bottomright",
          prefix: false,
        })
        .addAttribution(
          MAP_PROVIDER.apiKey
            ? '<a href="https://www.maptiler.com" target="_blank">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>'
            : "© OpenStreetMap contributors",
        )
        .addTo(map);

      const tileUrl = getTileUrl(currentStyle, MAP_PROVIDER.apiKey);
      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        tileSize: 512,
        zoomOffset: -1,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      layersGroupRef.current = L.featureGroup().addTo(map);
      mapInstanceRef.current = map;
      setIsReady(true);
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileUrl = getTileUrl(currentStyle, MAP_PROVIDER.apiKey);
    tileLayerRef.current.setUrl(tileUrl);
  }, [currentStyle]);

  // Update Markers & Dashed Relocation Lines
  useEffect(() => {
    if (!isReady || !mapInstanceRef.current || !layersGroupRef.current || !zones.length) return;
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;

    group.clearLayers();
    markersRef.current.clear();

    const bounds: [number, number][] = [];
    const safeSitesAdded = new Set<string>();

    zones.forEach((zone) => {
      if (typeof zone.lat !== "number" || typeof zone.lon !== "number") return;
      bounds.push([zone.lat, zone.lon]);

      const isRed = zone.zone_color === "Red";
      const color = ZONE_COLORS[zone.zone_color] || "#4c806d";
      const isSelected = selectedId === zone.village_id;

      // 1. Draw dashed line from Red Risk Village to Candidate Relocation Site
      if (isRed || isSelected) {
        const { site: bestSite, distance } = findBestSafeSite(zone);
        const estMins = Math.round((distance / 28) * 60);

        // Dashed cyan line
        L.polyline(
          [
            [zone.lat, zone.lon],
            [bestSite.lat, bestSite.lon],
          ],
          {
            color: "#0284c7",
            weight: 2.5,
            opacity: 0.9,
            dashArray: "7, 7",
            lineCap: "round",
          },
        ).addTo(group);

        // Distance & drive-time badge at midpoint
        const pMid: [number, number] = [
          (zone.lat + bestSite.lat) / 2,
          (zone.lon + bestSite.lon) / 2,
        ];

        const badgeIcon = L.divIcon({
          className: "route-midpoint-badge",
          html: `
            <div style="background: rgba(15, 23, 42, 0.92); border: 1px solid #38bdf8; border-radius: 12px; padding: 2px 7px; color: #ffffff; font-family: monospace; font-size: 10px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4); transform: translate(-50%, -50%); display: flex; align-items: center; gap: 4px;">
              <span style="color: #38bdf8;">${distance.toFixed(1)} km</span>
              <span style="color: #94a3b8;">(~${estMins}m)</span>
            </div>
          `,
          iconSize: [0, 0],
        });

        L.marker(pMid, { icon: badgeIcon, interactive: false }).addTo(group);

        // Add Safe Site 'S' Marker if not already placed
        if (!safeSitesAdded.has(bestSite.site_id)) {
          safeSitesAdded.add(bestSite.site_id);
          bounds.push([bestSite.lat, bestSite.lon]);

          const safeIcon = L.divIcon({
            className: "safe-site-pin",
            html: `
              <div style="position: relative; width: 22px; height: 22px; display: grid; place-items: center; cursor: pointer;">
                <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(16, 185, 129, 0.4); animation: ping 2.5s infinite;"></div>
                <div style="width: 18px; height: 18px; border-radius: 50%; background: #059669; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.45); display: grid; place-items: center; color: #ffffff; font-size: 10px; font-weight: 800; font-family: monospace;">
                  S
                </div>
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const safeMarker = L.marker([bestSite.lat, bestSite.lon], {
            icon: safeIcon,
          }).addTo(group);

          safeMarker.bindPopup(`
            <div style="font-family: var(--app-font-sans, system-ui); font-size: 12px; padding: 2px;">
              <strong style="color: #065f46;">🛡️ Safe Site: ${bestSite.site_name}</strong>
              <div style="margin-top: 4px; font-size: 10px; color: #60717c; font-family: monospace;">Candidate relocation zone</div>
            </div>
          `);
        }
      }

      // 2. Village Marker
      const mlProb = (
        (zone.landslide_probability ?? zone.landslide_ml_score ?? 0) * 100
      ).toFixed(1);
      const detScore = (
        zone.deterministic_hazard_score ??
        zone.hazard_score ??
        0
      ).toFixed(2);
      const finalScore = ((zone.hazard_score ?? 0) * 100).toFixed(0);

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: grid; place-items: center; cursor: pointer;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: ${color}44; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.45); transform: ${isSelected ? "scale(1.4)" : "scale(1)"}; transition: transform 0.2s;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([zone.lat, zone.lon], { icon: customIcon }).addTo(
        group,
      );

      const popupContent = `
        <div style="font-family: inherit; min-width: 200px; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(114, 114, 112, 0.2); padding-bottom: 6px; margin-bottom: 8px;">
            <strong style="font-size: 14px; font-weight: 700; color: #4B5125;">${zone.village_name}</strong>
            <span style="background: ${color}20; color: ${color}; font-weight: 700; font-size: 10px; padding: 2px 8px; border-radius: 9999px; font-family: monospace;">${zone.zone_color} Zone</span>
          </div>
          <div style="font-family: monospace; font-size: 11px; color: #727270; line-height: 1.7;">
            <div style="display: flex; justify-content: space-between;">
              <span>Base Det:</span> <b style="color: #4B5125;">${detScore}</b>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>ML Landslide:</span> <b style="color: #b65343;">${mlProb}%</b>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(114, 114, 112, 0.15); padding-top: 5px; margin-top: 5px;">
              <span style="font-weight: 600; color: #4B5125;">Blended Score:</span> <b style="color: #4B5125; font-size: 12px;">${finalScore}/100</b>
            </div>
          </div>
          <div style="display: flex; gap: 6px; margin-top: 10px;">
            <a href="/villages/${zone.village_id}" style="flex: 1; text-align: center; padding: 6px 8px; background: #4B5125; color: #FEFEFE; text-decoration: none; font-size: 11px; font-weight: 700; border-radius: 6px;">
              Record →
            </a>
            <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${zone.lat},${zone.lon}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; padding: 6px 10px; background: #F0F1DB; color: #4B5125; text-decoration: none; font-size: 11px; font-weight: 700; border-radius: 6px; border: 1px solid rgba(114, 114, 112, 0.25);" title="Open Google Street View 360° panorama">
              Street View ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { offset: [0, -8] });

      marker.on("click", () => {
        onSelect?.(zone.village_id);
      });

      if (isSelected) {
        marker.openPopup();
      }

      markersRef.current.set(zone.village_id, marker);
    });

    if (bounds.length && !selectedId) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }
  }, [isReady, zones]);

  // When selectedId changes, pan to selected marker
  useEffect(() => {
    if (!isReady || !mapInstanceRef.current || !selectedId) return;
    const selectedZone = zones.find((z) => z.village_id === selectedId);
    if (selectedZone && selectedZone.lat && selectedZone.lon) {
      mapInstanceRef.current.flyTo([selectedZone.lat, selectedZone.lon], 11.5, {
        duration: 0.8,
      });
      const marker = markersRef.current.get(selectedId);
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedId, isReady, zones]);

  function handleRecenter() {
    if (!mapInstanceRef.current || !zones.length) return;
    const bounds: [number, number][] = zones
      .filter((z) => typeof z.lat === "number" && typeof z.lon === "number")
      .map((z) => [z.lat, z.lon]);
    if (bounds.length) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }
  }

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] h-screen w-screen overflow-hidden bg-[#ECE5DC]"
          : `relative w-full overflow-hidden bg-[#ECE5DC] transition-all duration-200 ${className ?? "h-[360px]"}`
      }
    >
      {/* Unified Single-Row Map HUD Capsule */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2.5 rounded-lg border border-[#727270]/20 bg-[#FEFEFE]/95 px-3.5 py-1.5 shadow-sm backdrop-blur-md pointer-events-auto">
        <div className="flex items-center gap-2 border-r border-[#727270]/20 pr-2.5">
          <span className="h-2 w-2 rounded-full bg-[#4B5125] animate-pulse" />
          <span className="font-mono text-xs font-bold text-[#4B5125] whitespace-nowrap">
            Hazard Corridor
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#727270]">
          <span className="flex items-center gap-1 font-semibold text-[#b65343]"><span className="h-2 w-2 rounded-full bg-[#b65343]" /> Red</span>
          <span className="flex items-center gap-1 font-semibold text-[#cb7339]"><span className="h-2 w-2 rounded-full bg-[#cb7339]" /> Orange</span>
          <span className="flex items-center gap-1 font-semibold text-[#d5a938]"><span className="h-2 w-2 rounded-full bg-[#d5a938]" /> Yellow</span>
          <span className="flex items-center gap-1 font-semibold text-[#4c806d]"><span className="h-2 w-2 rounded-full bg-[#4c806d]" /> Green</span>
          <span className="flex items-center gap-1 border-l border-[#727270]/20 pl-2 font-semibold text-[#0284c7]">
            <span className="h-0.5 w-3 border-t-2 border-dashed border-[#0284c7]" /> Evac Line
          </span>
        </div>
      </div>

      {/* Style Switcher, Recenter & Fullscreen Overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5">
        <div className="flex rounded-lg border border-[#727270]/20 bg-[#FEFEFE]/95 p-1 shadow-sm backdrop-blur-md">
          {MAP_STYLES.map((style) => {
            const Icon = style.icon;
            const active = currentStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setCurrentStyle(style.id)}
                title={`Switch to ${style.label}`}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[#4B5125] text-[#FEFEFE] shadow-xs"
                    : "text-[#727270] hover:bg-[#F0F1DB] hover:text-[#4B5125]"
                }`}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{style.label}</span>
              </button>
            );
          })}
        </div>

        {/* Recenter Button */}
        <button
          type="button"
          onClick={handleRecenter}
          title="Reset View / Fit all villages"
          className="grid h-8 w-8 place-items-center rounded-lg border border-[#727270]/20 bg-[#FEFEFE]/95 text-[#4B5125] shadow-sm hover:bg-[#F0F1DB] backdrop-blur-md transition-colors"
        >
          <Navigation2 size={14} />
        </button>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          title={isFullscreen ? "Exit Fullscreen (Esc)" : "Open Fullscreen Map"}
          className="flex items-center gap-1.5 rounded-lg border border-[#727270]/20 bg-[#FEFEFE]/95 px-3 py-1.5 text-xs font-bold text-[#4B5125] shadow-sm hover:bg-[#F0F1DB] backdrop-blur-md transition-colors"
          data-testid="button-fullscreen-map"
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
        </button>
      </div>

      {/* Leaflet Map Target Element */}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
