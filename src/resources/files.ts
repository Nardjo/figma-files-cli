/**
 * Figma file resource — introspect file structure (document, pages, frames).
 *
 * Endpoint reference: https://www.figma.com/developers/api#files-endpoints
 */
import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  page?: string;
  depth?: string;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}

interface FigmaFileResponse {
  name: string;
  lastModified: string;
  version: string;
  document: FigmaNode;
}

export const filesResource = new Command("files").description(
  "Introspect Figma files — list pages, frames, and nodes",
);

// ── GET ───────────────────────────────────────────────
// Full file dump (raw JSON). Use sparingly; files are large.
filesResource
  .command("get")
  .description("Get the full file document (raw)")
  .argument("<fileKey>", "Figma file key (from URL: figma.com/file/<key>/...)")
  .option("--depth <n>", "Limit traversal depth (1 = pages only, 2 = frames, etc.)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  figma-files-cli files get abc123\n  figma-files-cli files get abc123 --depth 2 --json",
  )
  .action(async (fileKey: string, opts: ActionOpts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.depth) params.depth = opts.depth;
      const data = await client.get(`/v1/files/${fileKey}`, params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── PAGES ─────────────────────────────────────────────
// List top-level pages (CANVAS nodes) of a file.
filesResource
  .command("pages")
  .description("List pages (canvases) of a file")
  .argument("<fileKey>", "Figma file key")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .addHelpText("after", "\nExample:\n  figma-files-cli files pages abc123")
  .action(async (fileKey: string, opts: ActionOpts) => {
    try {
      const data = (await client.get(`/v1/files/${fileKey}`, {
        depth: "1",
      })) as FigmaFileResponse;
      const pages =
        data.document.children?.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
        })) ?? [];
      output(
        { fileName: data.name, lastModified: data.lastModified, pages },
        { json: opts.json, format: opts.format },
      );
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── FRAMES ────────────────────────────────────────────
// List top-level frames within one or all pages.
filesResource
  .command("frames")
  .description("List top-level frames of a file (optionally filtered to one page)")
  .argument("<fileKey>", "Figma file key")
  .option("--page <name>", "Filter to a single page by name (case-insensitive)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .addHelpText(
    "after",
    "\nExamples:\n  figma-files-cli files frames abc123\n  figma-files-cli files frames abc123 --page Onboarding",
  )
  .action(async (fileKey: string, opts: ActionOpts) => {
    try {
      const data = (await client.get(`/v1/files/${fileKey}`, {
        depth: "2",
      })) as FigmaFileResponse;
      const filterName = opts.page?.toLowerCase();
      const pages = (data.document.children ?? []).filter(
        (p) => !filterName || p.name.toLowerCase() === filterName,
      );
      const frames = pages.flatMap((page) =>
        (page.children ?? [])
          .filter((c) => c.type === "FRAME" || c.type === "COMPONENT" || c.type === "COMPONENT_SET")
          .map((f) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            page: page.name,
          })),
      );
      output(
        { fileName: data.name, frames },
        { json: opts.json, format: opts.format },
      );
    } catch (err) {
      handleError(err, opts.json);
    }
  });
