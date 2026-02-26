import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public", "products");
const OUT = path.join(ROOT, "public", "products_flat");

const exts = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function cleanFolderName(folderName) {
  return String(folderName || "")
    .replace(/^\d+\s*/g, "")
    .replace(/\bfull\s*body\b/gi, "")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

fs.mkdirSync(OUT, { recursive: true });

const files = walk(SRC).filter((p) =>
  exts.has(path.extname(p).toLowerCase())
);

/*
Elegimos 1 imagen por carpeta:
✔ Preferimos la que NO sea "render"
✔ Preferimos la que NO sea "full body"
*/

const byFolder = new Map();

for (const filePath of files) {
  const folder = path.dirname(filePath);
  const base = path.basename(filePath).toLowerCase();

  let score = 0;

  if (base.includes("render")) score += 10;
  if (base.includes("full")) score += 5;

  const curr = byFolder.get(folder);

  if (!curr || score < curr.score) {
    byFolder.set(folder, { filePath, score });
  }
}

let copied = 0;

for (const [folder, pick] of byFolder.entries()) {
  const folderName = path.basename(folder);
  const cleaned = cleanFolderName(folderName);
  const key = slugify(cleaned);

  const ext = path.extname(pick.filePath).toLowerCase() || ".jpg";
  const dest = path.join(OUT, `${key}${ext}`);

  fs.copyFileSync(pick.filePath, dest);
  copied++;
}

console.log(`✅ products_flat generado. Archivos copiados: ${copied}`);
