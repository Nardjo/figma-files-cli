# figma-files-cli

CLI for the figma-files API. Made with [api2cli.dev](https://api2cli.dev).

## Install

```bash
npx api2cli install <user>/figma-files-cli
```

This clones the repo, builds the CLI, links it to your PATH, and installs the AgentSkill to your coding agents.

## Install AgentSkill only

```bash
npx skills add <user>/figma-files-cli
```

## Usage

```bash
figma-files-cli auth set "your-token"
figma-files-cli auth test
figma-files-cli --help
```

## Resources

Run `figma-files-cli --help` to see available resources.

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`
