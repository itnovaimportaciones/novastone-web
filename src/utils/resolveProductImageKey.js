import { normalizeTextureKey } from "./normalizeTextureKey";
import { extractTextureName } from "./extractTextureName";

/**
 * Devuelve el "key" que existe en /public/products_flat
 * Corrige typos, sufijos AB/A/B, y casos donde el nombre en DB no coincide.
 */
export function resolveProductImageKey(modelValue) {
  const base = normalizeTextureKey(extractTextureName(modelValue));

  // Alias -> archivo existente en products_flat (sin extension)
  const ALIAS = {
    // Typos / variantes
    "artic-ice-white": "arctic-ice-white",
    "atumn-maple": "autumn-maple",
    "lime-stone": "limestone",
    "bvulgari-black": "bvlgari-black",
    "lighting-grey": "lightning-grey", // si en tu DB esta mal escrito

    // Sufijos AB/A/B o variantes de nombre
    "fendi-white-ab": "fendi-white",
    "louiskin-a": "louiskin",
    "louiskin-b": "louiskin",
    "nata-b": "nata",
    "new-tajmhal-ab": "new-taj-mahal",
    "pandora-ab": "pandora",

    // Caso especial que vos marcaste
    "travertino-al-agua": "portland",

    // Si tenes "Royal Brazilianite" pero archivo es brazilianite.jpg
    "royal-brazilianite": "brazilianite",
  };

  return ALIAS[base] || base;
}
