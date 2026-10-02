import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { FIGURE_FILES } from "@/features/exercises/config";

/**
 * Serves the scatter and correlation figures saved for the report.
 * Revalidated by ETag, so regenerating the PNGs shows up on the next reload.
 */
export async function GET(request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!name || name !== path.basename(name) || !FIGURE_FILES.has(name)) {
    return new NextResponse(null, { status: 404 });
  }

  const candidates = [
    path.join(process.cwd(), "public", "figures", name),
    path.join(process.cwd(), "..", "report", "figures", name),
  ];
  let file: string | null = null;
  for (const candidate of candidates) {
    try {
      await stat(candidate);
      file = candidate;
      break;
    } catch {
      /* try next */
    }
  }
  if (!file) return new NextResponse(null, { status: 404 });

  const info = await stat(file);
  const etag = `"${info.size.toString(36)}-${info.mtimeMs.toString(36)}"`;
  const headers = { ETag: etag, "Cache-Control": "no-cache" };

  if (request.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers });
  return new NextResponse(await readFile(file), { headers: { ...headers, "Content-Type": "image/png" } });
}
