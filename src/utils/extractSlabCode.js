export function extractSlabCode(value) {
  if (!value) return "";
  const m = String(value).match(/[A-Z]{2,}\d{6,}[A-Z0-9]*/);
  return m ? m[0] : "";
}
