/**
 * Figma images resource — render nodes as PNG/SVG/JPG/PDF and download locally.
 *
 * Endpoint reference: https://www.figma.com/developers/api#get-images-endpoint
 *
 * The render endpoint returns S3 URLs (valid ~30 min). The `download` subcommand
 * fetches them and saves to disk.
 */
import { Command } from "commander";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  ids?: string;
  imgFormat?: string;
  scale?: string;
  out?: string;
}

interface ImageRenderResponse {
  err: string | null;
  images: Record<string, string | null>;
}

const VALID_FORMATS = ["png", "svg", "jpg", "pdf"];

export const imagesResource = new Command("images").description(
  "Render Figma nodes as PNG/SVG/JPG/PDF",
);

// ── RENDER ────────────────────────────────────────────
// Returns S3 URLs (do not save to disk).
imagesResource
  .command("render")
  .description("Render nodes and return S3 URLs (no local download)")
  .argument("<fileKey>", "Figma file key")
  .requiredOption("--ids <ids>", "Comma-separated node IDs")
  .option("--img-format <fmt>", `Image format: ${VALID_FORMATS.join("|")}`, "png")
  .option("--scale <n>", "Scale factor 1-4 (PNG/JPG only)", "2")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format (text/json/etc.) — distinct from --img-format")
  .addHelpText(
    "after",
    "\nExample:\n  figma-files-cli images render abc123 --ids 1:23 --img-format png --scale 2",
  )
  .action(async (fileKey: string, opts: ActionOpts) => {
    try {
      if (!opts.ids) throw new Error("--ids is required");
      const fmt = opts.imgFormat ?? "png";
      if (!VALID_FORMATS.includes(fmt)) {
        throw new Error(`Invalid --img-format: ${fmt}. Use one of ${VALID_FORMATS.join("|")}`);
      }
      const params: Record<string, string> = {
        ids: opts.ids,
        format: fmt,
      };
      if (fmt === "png" || fmt === "jpg") {
        params.scale = opts.scale ?? "2";
      }
      const data = await client.get(`/v1/images/${fileKey}`, params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DOWNLOAD ──────────────────────────────────────────
// Render + fetch the URLs and save locally.
imagesResource
  .command("download")
  .description("Render nodes and save images to disk")
  .argument("<fileKey>", "Figma file key")
  .requiredOption("--ids <ids>", "Comma-separated node IDs")
  .option("--img-format <fmt>", `Image format: ${VALID_FORMATS.join("|")}`, "png")
  .option("--scale <n>", "Scale factor 1-4 (PNG/JPG only)", "2")
  .option("--out <dir>", "Output directory", "./figma-exports")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExample:\n  figma-files-cli images download abc123 --ids 1:23,4:56 --out ./mockups",
  )
  .action(async (fileKey: string, opts: ActionOpts) => {
    try {
      if (!opts.ids) throw new Error("--ids is required");
      const fmt = opts.imgFormat ?? "png";
      if (!VALID_FORMATS.includes(fmt)) {
        throw new Error(`Invalid --img-format: ${fmt}. Use one of ${VALID_FORMATS.join("|")}`);
      }
      const params: Record<string, string> = {
        ids: opts.ids,
        format: fmt,
      };
      if (fmt === "png" || fmt === "jpg") {
        params.scale = opts.scale ?? "2";
      }
      const renderResp = (await client.get(
        `/v1/images/${fileKey}`,
        params,
      )) as ImageRenderResponse;
      if (renderResp.err) {
        throw new Error(`Figma render error: ${renderResp.err}`);
      }
      const outDir = opts.out ?? "./figma-exports";
      mkdirSync(outDir, { recursive: true });

      const downloads: { id: string; path: string; bytes: number }[] = [];
      for (const [nodeId, url] of Object.entries(renderResp.images)) {
        if (!url) continue;
        const safeId = nodeId.replace(/[^a-zA-Z0-9_-]/g, "_");
        const filePath = join(outDir, `${safeId}.${fmt}`);
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch ${url}: ${res.status}`);
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        writeFileSync(filePath, buffer);
        downloads.push({ id: nodeId, path: filePath, bytes: buffer.length });
      }
      output({ downloaded: downloads.length, files: downloads }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
