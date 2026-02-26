export function extractTextureName(value) {
  if (!value) return "";

  return String(value)
    .replace(/[A-Z]{2,}\d{6,}[A-Z0-9]*/g, "") // saca codigos tipo LHA321620G30
    .replace(/\(.*?\)/g, "")                 // saca "(Honed)" "(Polished)" etc
    .replace(/\bfull\s*body\b/gi, "")        // saca FULL BODY
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
