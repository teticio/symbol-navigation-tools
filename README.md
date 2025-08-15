# Go To Definition Tool

A VS Code extension that contributes a language model tool Copilot can call in agent mode to find where a symbol is defined.

## What It Does

Given a symbol and a file URI, the tool:

- Finds the first exact occurrence of the symbol in the file (optionally constrained to a line range).
- Returns where that symbol is defined.

Results are returned as:

- `path:line`
- `path:start-end` (if the range spans multiple lines)

## Why This Tool

Navigating with code references is faster and closer to how humans read code than plain text search.

- Reference-first navigation: Follow definitions and references instead of scanning for text matches to reduce noise and speed up understanding.
- Inspect installed code, not the web: With modules or packages, LLMs may rely on outdated knowledge or external docs. This tool encourages inspecting the actual code in your workspace and installed dependencies so answers match your environment.

## Tool

- Name: `go-to-definition`
- Reference: `#goToDefinition`
- Purpose: Resolve a symbol's definition from a given file and optional line bounds.

## Usage

In Copilot Chat:

- Reference style:
  - `#goToDefinition: Find the definition of "foo" in src/index.ts (lines 1-200)`

With explicit parameters:

```json
{
  "tool": "#goToDefinition",
  "arguments": {
    "symbol": "foo",
    "uri": "src/index.ts",
    "startLineNumber": 1,
    "endLineNumber": 200
  }
}
```

Notes:

- `uri` accepts:
  - Workspace-relative: `src/index.ts`
  - Absolute path: `/home/user/project/src/index.ts`
  - File URI: `file:///...`
- `startLineNumber` and `endLineNumber` are 1-based and inclusive.

## Parameters

- `symbol` (string, required): Exact symbol text to look for.
- `uri` (string, required): File to search (relative, absolute, or file URI).
- `startLineNumber` (number, optional): Start line bound (inclusive).
- `endLineNumber` (number, optional): End line bound (inclusive).

## Examples

- Find the definition of a function:
  - `#goToDefinition — "createServer" in server.ts`
- Constrain search to the first 200 lines:
  - `#goToDefinition — "User" in src/models/user.ts (lines 1–200)`

Example outputs:

- `src/index.ts:42`
- `src/parser.ts:10-14`

## Development

- Prerequisites: Node.js and npm installed.
- Setup:
  - `npm install`
  - Press F5 in VS Code to launch the Extension Development Host.
- Test:
  - In the dev host, open a workspace containing the target files.
  - Open Copilot Chat (agent mode) and invoke `#goToDefinition` as shown above.

## Known Limitations

- Matches the first exact textual occurrence of the symbol before resolving definition.
- Results depend on language support and available symbols in the workspace.
- Large files or many definitions may impact performance.

## Release Notes

### 0.1.0

- Initial tool: `go-to-definition` (`#goToDefinition`) with symbol search, optional line bounds, and definition location output.
