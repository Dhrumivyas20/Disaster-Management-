/**
 * Map provider seam.
 *
 * Keep the dashboard's map UI independent from the vendor SDK. Replace this
 * configuration with your provider's URL template, access token wiring, and
 * adapter when you are ready for live tiles. The current risk map remains
 * usable without a key by rendering the curated demo layer.
 */
export type MapProviderConfig = {
  name: string;
  mode: "sample" | "custom";
  tileUrlTemplate: string;
  attribution: string;
  apiBaseUrl?: string;
  apiKey?: string;
};

export const SAMPLE_MAP_PROVIDER: MapProviderConfig = {
  name: "Sample map layer",
  mode: "sample",
  tileUrlTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors",
};

export const MAP_PROVIDER: MapProviderConfig = {
  ...SAMPLE_MAP_PROVIDER,
  ...(import.meta.env.VITE_MAP_API_URL && import.meta.env.VITE_MAP_TILE_URL_TEMPLATE
    ? {
        name: "Custom map API",
        mode: "custom" as const,
        apiBaseUrl: import.meta.env.VITE_MAP_API_URL,
        apiKey: import.meta.env.VITE_MAP_API_KEY,
        tileUrlTemplate: import.meta.env.VITE_MAP_TILE_URL_TEMPLATE,
      }
    : {}),
};

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