#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { filesResource } from "./resources/files.js";
import { nodesResource } from "./resources/nodes.js";
import { imagesResource } from "./resources/images.js";
import { stylesResource } from "./resources/styles.js";

const program = new Command();

program
  .name("figma-files-cli")
  .description("CLI for the Figma REST API — files, nodes, images, styles")
  .version("0.1.0")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable debug logging", false)
  .option("--no-color", "Disable colored output")
  .option("--no-header", "Omit table/csv headers (for piping)")
  .hook("preAction", (_thisCmd, actionCmd) => {
    const root = actionCmd.optsWithGlobals();
    globalFlags.json = root.json ?? false;
    globalFlags.format = root.format ?? "text";
    globalFlags.verbose = root.verbose ?? false;
    globalFlags.noColor = root.color === false;
    globalFlags.noHeader = root.header === false;
  });

program.addCommand(authCommand);
program.addCommand(filesResource);
program.addCommand(nodesResource);
program.addCommand(imagesResource);
program.addCommand(stylesResource);

program.parse();
