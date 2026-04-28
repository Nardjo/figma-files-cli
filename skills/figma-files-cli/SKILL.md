---
name: figma-files
description: Manage Figma files via CLI — files, nodes, images, styles. Use when user mentions 'figma', 'figma file', 'figma frames', 'export figma', 'design tokens', 'figma mockups', 'figma node', or wants to read/export from a Figma design file via its REST API.
category: design
---

# figma-files-cli

A CLI wrapper around the Figma REST API. Lets an agent introspect a Figma file, list pages and frames, render nodes as PNG/SVG/JPG/PDF, download images locally, and read published design styles.

This is **not** the Figma Code Connect CLI (which is unrelated). This CLI focuses on file inspection and asset extraction.

## When To Use This Skill

Use the `figma-files-cli` skill when you need to:

- Inspect the structure of a Figma file (pages, frames, components) given its file key
- Find specific frames by name or page (e.g., "give me all frames of the Onboarding page")
- Render and download mockup images (PNG/SVG) so the agent can visually reason about a design
- Read design tokens (colors, text styles, effects) to translate a Figma design system into code
- Fetch the JSON of a specific node by ID

## Capabilities

- **List pages** of a file (top-level CANVAS nodes).
- **List frames** of a file, optionally filtered to a single page by name.
- **Get raw file JSON** with optional depth limit for large files.
- **Get specific nodes** by comma-separated IDs.
- **Render nodes** as PNG, SVG, JPG, or PDF — returns S3 URLs.
- **Download nodes** to a local directory, ready to be drag-dropped or read by the agent.
- **List styles** (colors, text, effects, grids) published in a file.

## Common Use Cases

- "Show me the names of all screens in my Figma onboarding flow."
- "Download the home screen and settings frames as PNG so we can review them."
- "What colors are defined in the design system?"
- "Get the JSON of node 1:23 so I can see its layer hierarchy."
- "List all frames in the 'Paywall' page of file `abc123`."

## Setup

If `figma-files-cli` is not found, install and build it:
```bash
bun --version || curl -fsSL https://bun.sh/install | bash
npx api2cli bundle figma-files
npx api2cli link figma-files
```

Or install the published version:
```bash
npm i -g figma-files-cli
```

Always use `--json` flag when calling commands programmatically.

## Working Rules

- Always use `--json` for agent-driven calls so downstream steps can parse the result.
- Start with `--help` if the exact action or flags are unclear instead of guessing.
- Prefer `files pages` and `files frames` over `files get` — the latter dumps the entire document JSON which is huge.
- For image downloads, set `--out` to a sensible per-task directory (e.g., `./figma-exports/<feature>/`) so files don't pile up in `cwd`.
- The `images render` URLs are S3 pre-signed and expire (~30 min). Don't store them — re-render if you need them later.

## Authentication

```bash
figma-files-cli auth set "<personal-access-token>"
figma-files-cli auth show
```

Generate a token at https://www.figma.com/settings → Personal access tokens. Read scope is enough for this CLI.

Token stored at `~/.config/tokens/figma-files-cli.txt` (chmod 600).

## File key — where to find it

Figma file URLs look like:
```
https://www.figma.com/file/<FILE_KEY>/<File-Name>
https://www.figma.com/design/<FILE_KEY>/<File-Name>
```

The `<FILE_KEY>` is the segment between `/file/` (or `/design/`) and the file name.

## Resources

### `files` — file structure introspection

| Action | Flags | Description |
|---|---|---|
| `get <fileKey>` | `--depth <n>`, `--json`, `--format <fmt>` | Get the full file document (raw). Heavy — prefer `pages` or `frames`. |
| `pages <fileKey>` | `--json`, `--format <fmt>` | List top-level pages (canvases) with id, name, type. |
| `frames <fileKey>` | `--page <name>`, `--json`, `--format <fmt>` | List top-level frames, optionally filtered to one page (case-insensitive). |

### `nodes` — fetch specific nodes

| Action | Flags | Description |
|---|---|---|
| `get <fileKey>` | `--ids <id1,id2>` (required), `--depth <n>`, `--json` | Get one or more nodes by ID. |

### `images` — render and download

| Action | Flags | Description |
|---|---|---|
| `render <fileKey>` | `--ids <id1,id2>` (required), `--img-format <png\|svg\|jpg\|pdf>`, `--scale <1-4>`, `--json` | Render nodes and return S3 URLs without saving. |
| `download <fileKey>` | `--ids <id1,id2>` (required), `--img-format <png\|svg\|jpg\|pdf>`, `--scale <1-4>`, `--out <dir>`, `--json` | Render and save images to `--out` directory (default `./figma-exports`). |

### `styles` — design tokens

| Action | Flags | Description |
|---|---|---|
| `list <fileKey>` | `--json`, `--format <fmt>` | List all published styles (colors, text, effects, grids). |

### `auth` — credentials

| Action | Description |
|---|---|
| `set <token>` | Save token (chmod 600). |
| `show` | Show masked token. |
| `remove` | Delete stored token. |
| `test` | Verify token works against the API. |

## Output Format

`--json` returns a standardized envelope:
```json
{ "ok": true, "data": { ... }, "meta": { "total": 42 } }
```

On error: `{ "ok": false, "error": { "message": "...", "status": 401 } }`

## Quick Reference

```bash
figma-files-cli --help                          # All resources + global flags
figma-files-cli files --help                    # Actions for files
figma-files-cli files frames --help             # Flags for files frames

# Typical flow:
figma-files-cli files pages <fileKey> --json
figma-files-cli files frames <fileKey> --page Onboarding --json
figma-files-cli images download <fileKey> --ids "1:23,1:45" --out ./mockups
figma-files-cli styles list <fileKey> --json
```

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

Exit codes: 0 = success, 1 = API error, 2 = usage error
