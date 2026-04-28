/**
 * Figma styles resource — list design tokens (colors, text, effects, grids).
 *
 * Endpoint reference: https://www.figma.com/developers/api#get-file-styles-endpoint
 */
import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
}

export const stylesResource = new Command("styles").description(
  "List design styles (colors, text, effects, grids) of a file",
);

stylesResource
  .command("list")
  .description("List all published styles of a file")
  .argument("<fileKey>", "Figma file key")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .addHelpText("after", "\nExample:\n  figma-files-cli styles list abc123 --json")
  .action(async (fileKey: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/v1/files/${fileKey}/styles`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
