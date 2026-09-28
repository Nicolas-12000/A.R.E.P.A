// Regenerates src/app/tokens.css from DESIGN.md so the palette has one source of truth.
// Only colors and radii are exported: typography needs next/font variables (see globals.css).
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const css = execSync("npx --yes @google/design.md export --format css-tailwind DESIGN.md", {
  cwd: new URL("..", import.meta.url),
  encoding: "utf8",
});

const tokens = css.split("\n").filter((line) => /^\s*--(color|radius)-/.test(line));
if (tokens.length === 0) throw new Error("design.md export returned no color or radius tokens");

const output = [
  "/* Generated from DESIGN.md by `npm run design:tokens`. Do not edit by hand. */",
  "@theme {",
  ...tokens,
  "}",
  "",
].join("\n");

writeFileSync(new URL("../src/app/tokens.css", import.meta.url), output);
console.log(`tokens.css: ${tokens.length} tokens`);
