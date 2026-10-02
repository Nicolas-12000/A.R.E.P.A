import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(here, "..");
const repoRoot = path.join(frontendRoot, "..");

function copyDir(src, dst) {
  if (!fs.existsSync(src)) {
    console.warn(`[sync-public-assets] skip missing ${src}`);
    return;
  }
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (!name.endsWith(".png")) continue;
    fs.copyFileSync(path.join(src, name), path.join(dst, name));
  }
}

const figuresSrc = path.join(repoRoot, "report", "figures");
const figuresDst = path.join(frontendRoot, "public", "figures");
copyDir(figuresSrc, figuresDst);
console.log(`[sync-public-assets] figures → public/figures (${figuresDst})`);
