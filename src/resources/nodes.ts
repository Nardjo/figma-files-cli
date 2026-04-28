/**
 * Figma nodes resource — fetch one or more specific nodes by ID.
 *
 * Endpoint reference: https://www.figma.com/developers/api#get-file-nodes-endpoint
 */
import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  ids?: string;
  depth?: string;
}

export const nodesResource = new Command("nodes").description(
  "Fetch specific nodes by ID from a Figma file",
);

nodesResource
  .command("get")
  .description("Get one or more nodes by ID")
  .argument("<fileKey>", "Figma file key")
  .requiredOption("--ids <ids>", "Comma-separated node IDs (e.g. 1:23,4:56)")
  .option("--depth <n>", "Limit traversal depth inside each node")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .addHelpText(
    "after",
    "\nExample:\n  figma-files-cli nodes get abc123 --ids 1:23,4:56 --json",
  )
  .action(async (fileKey: string, opts: ActionOpts) => {
    try {
      if (!opts.ids) throw new Error("--ids is required");
      const params: Record<string, string> = { ids: opts.ids };
      if (opts.depth) params.depth = opts.depth;
      const data = await client.get(`/v1/files/${fileKey}/nodes`, params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
