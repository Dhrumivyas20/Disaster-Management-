export type MapProviderConfig = {
  name: string;
  mode: "sample" | "custom" | "maptiler";
  tileUrlTemplate: string;
  attribution: string;
  apiBaseUrl?: string;
  apiKey?: string;
  style?: "topo-v2" | "outdoor-v2" | "satellite" | "streets-v2" | "basic-v2";
};

const maptilerKey =
  import.meta.env.VITE_MAPTILER_KEY ||
  import.meta.env.VITE_MAPTILER_API_KEY ||
  import.meta.env.VITE_MAP_API_KEY;

export const SAMPLE_MAP_PROVIDER: MapProviderConfig = {
  name: "OpenStreetMap (Sample Layer)",
  mode: "sample",
  tileUrlTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors",
};

export const MAP_PROVIDER: MapProviderConfig = (() => {
  if (maptilerKey) {
    const style = (import.meta.env.VITE_MAPTILER_STYLE || "topo-v2") as MapProviderConfig["style"] || "topo-v2";
    const ext = style === "satellite" ? "jpg" : "png";
    const styleLabel = style === "topo-v2" ? "Topographic" : style.replace("-v2", "");
    return {
      name: `MapTiler ${styleLabel}`,
      mode: "maptiler" as const,
      apiKey: maptilerKey,
      style,
      tileUrlTemplate: `https://api.maptiler.com/maps/${style}/{z}/{x}/{y}.${ext}?key=${maptilerKey}`,
      attribution: "© MapTiler © OpenStreetMap contributors",
      apiBaseUrl: "https://api.maptiler.com",
    };
  }

  if (import.meta.env.VITE_MAP_API_URL && import.meta.env.VITE_MAP_TILE_URL_TEMPLATE) {
    return {
      name: "Custom Map API",
      mode: "custom" as const,
      apiBaseUrl: import.meta.env.VITE_MAP_API_URL,
      apiKey: import.meta.env.VITE_MAP_API_KEY,
      tileUrlTemplate: import.meta.env.VITE_MAP_TILE_URL_TEMPLATE,
      attribution: "© Custom Map Layer",
    };
  }

  return SAMPLE_MAP_PROVIDER;
})();

export function getMapTilerStaticMapUrl(
  lat: number = 30.4,
  lon: number = 79.1,
  zoom: number = 9,
  width: number = 800,
  height: number = 500,
  style: string = "topo-v2",
  key: string = maptilerKey || "",
) {
  if (!key) return null;
  return `https://api.maptiler.com/maps/${style}/static/${lon},${lat},${zoom}/${width}x${height}.png?key=${key}`;
}

export function buildMapTileUrl(
  zoom: number,
  x: number,
  y: number,
  provider: MapProviderConfig = MAP_PROVIDER,
) {
  return provider.tileUrlTemplate
    .replace("{z}", String(zoom))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
}