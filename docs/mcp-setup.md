# MCP Setup

This repository configures MCP servers for SAP CAP, SAP Fiori Elements, SAPUI5 development, and AI DevKit memory.

## Configured Servers

The VS Code workspace MCP config is stored in `.vscode/mcp.json`. Codex MCP config is stored in `.codex/config.toml`. AI DevKit also records the same server intent in `.ai-devkit.json`.

| Name | Purpose | Command |
| --- | --- | --- |
| `cap` | CAP CDS model, services, handlers, actions, functions | `npx -y @cap-js/mcp-server` |
| `fiori` | Fiori Elements, annotations, manifest, app generation/modification | `npx -y @sap-ux/fiori-mcp-server` |
| `ui5` | SAPUI5 controllers, XML views, formatters, bindings, UI5 linting | `npx -y @ui5/mcp-server` |
| `memory` | AI DevKit memory for stable, non-secret project decisions | `npx -y @ai-devkit/memory` |

## VS Code Usage

If your VS Code build or MCP extension supports workspace MCP config, reload the workspace and check the MCP server list. The server names should appear as `cap`, `fiori`, `ui5`, and `memory`.

If your client does not read `.vscode/mcp.json`, add each server manually through the VS Code Command Palette or the MCP extension settings using the same command and args from `.vscode/mcp.json`.

Equivalent manual server definitions:

```json
{
  "cap": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@cap-js/mcp-server"],
    "env": {}
  },
  "fiori": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@sap-ux/fiori-mcp-server"],
    "env": {}
  },
  "ui5": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@ui5/mcp-server"],
    "env": {}
  },
  "memory": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@ai-devkit/memory"],
    "env": {}
  }
}
```

## Codex Usage

Codex can read `.codex/config.toml` in this repository:

```toml
[mcp_servers.cap]
command = "npx"
args = ["-y", "@cap-js/mcp-server"]

[mcp_servers.fiori]
command = "npx"
args = ["-y", "@sap-ux/fiori-mcp-server"]

[mcp_servers.ui5]
command = "npx"
args = ["-y", "@ui5/mcp-server"]

[mcp_servers.memory]
command = "npx"
args = ["-y", "@ai-devkit/memory"]
```

The AI DevKit generated `.ai-devkit.json` and `.codex/commands/*`. Its interactive `install` command may ask before overwriting existing artifacts, so the Codex MCP config is kept explicitly in `.codex/config.toml`.

## Validation Performed

The servers were validated by sending MCP `initialize` and `tools/list` requests over stdio.

Observed server versions:

- CAP MCP: `cds-mcp` version `0.1.0`
- Fiori MCP: `fiori-mcp` version `0.7.1`
- UI5 MCP: `UI5` version `0.2.11`
- Memory MCP: `ai-devkit-memory` version `0.1.0`

Observed tools:

- CAP MCP: `search_model`, `search_docs`
- Fiori MCP: `search_docs`, `list_fiori_apps`, `list_functionality`, `get_functionality_details`, `execute_functionality`
- UI5 MCP: `get_guidelines`, `run_ui5_linter`, `get_api_reference`, `get_project_info`, `create_ui5_app`, `get_version_info`, `get_integration_cards_guidelines`, `create_integration_card`, `run_manifest_validation`, `get_typescript_conversion_guidelines`
- Memory MCP: `memory_storeKnowledge`, `memory_updateKnowledge`, `memory_searchKnowledge`; store only stable non-secret decisions.

## Useful Check Commands

These are validation commands, not persistent project scripts.

```powershell
npx -y @cap-js/mcp-server --help
npx -y --package @cap-js/mcp-server cds-mcp --version
npx -y --package @sap-ux/fiori-mcp-server fiori-mcp --version
npx -y --package @ui5/mcp-server ui5mcp
npx -y @ai-devkit/memory
```

Note: `@sap-ux/fiori-mcp-server` and `@ui5/mcp-server` are stdio MCP servers. Passing `--help` may start the server instead of printing help, depending on the package.

## Troubleshooting

- If a server is not listed in VS Code, reload the window and confirm that the MCP extension/client supports `.vscode/mcp.json`.
- If `npx` cannot download a package, check npm registry access, proxy, and corporate firewall settings.
- If `npx` prompts interactively, keep `-y` in the args.
- If UI5 MCP rejects command-line flags, run it without extra flags; it does not accept arbitrary CLI arguments.
- If AI DevKit memory creates local runtime files, keep them ignored under `.ai-devkit/`.
- If `npx -y @ai-devkit/memory` prints npm deprecation warnings but still returns MCP `initialize` and `tools/list`, the server is usable; record the warning and re-check package updates later.
- If a package version changes behavior, record the observed version and consider pinning the package version in the MCP config.
- Do not put credentials, service keys, or private endpoints in MCP config.
