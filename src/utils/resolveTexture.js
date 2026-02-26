import { normalizeTextureKey } from "./normalizeTextureKey";
import { extractTextureName } from "./extractTextureName";

export function resolveTexture(textureName) {
  const cleanName = extractTextureName(textureName);
  const key = normalizeTextureKey(cleanName);

  return `/textures/${key}.jpg`;
}
