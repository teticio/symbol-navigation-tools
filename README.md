# Symbol Navigation Tools

A VS Code extension that contributes language model tools Copilot can call in agent mode to navigate and understand code structure.

## What It Does

This extension provides two complementary tools for code navigation:

1. **Go To Definition** - Find where a specific symbol is defined
2. **Get Document Symbols** - Get an overview of all symbols in a file

## Why These Tools

Navigating with code references is faster and closer to how humans read code than plain text search.

- **Reference-first navigation**: Follow definitions and references instead of scanning for text matches to reduce noise and speed up understanding
- **Structural overview**: Quickly understand file organization and available symbols
- **Inspect installed code, not the web**: With modules or packages, LLMs may rely on outdated knowledge or external docs. These tools encourage inspecting the actual code in your workspace and installed dependencies so answers match your environment

## Tools

### 1. Go To Definition (`#goToDefinition`)

Given a symbol and a file URI, the tool:

- Finds the first exact occurrence of the symbol in the file (optionally constrained to a line range)
- Returns where that symbol is defined

Results are returned as:
- `path:line`
- `path:start-end` (if the range spans multiple lines)

**Parameters:**
- `symbol` (string, required): Exact symbol text to look for
- `uri` (string, required): File to search (absolute or file URI)
- `startLineNumber` (number, optional): Start line bound (inclusive)
- `endLineNumber` (number, optional): End line bound (inclusive)

### 2. Get Document Symbols (`#getDocumentSymbols`)

Retrieves all symbols (functions, classes, variables, etc.) from a file to provide a structural overview.

**Also retrieves hover information for each symbol** (such as docstrings, comments, or type/type signature information, depending on language support).

**Parameters:**
- `uri` (string, required): File to analyze (absolute or file URI)

## Usage

In Copilot Chat:

**Reference style:**
- `#goToDefinition: Find the definition of "createServer" in server.ts`
- `#goToDefinition: Find the definition of "User" in src/models/user.ts (lines 1-200)`
- `#getDocumentSymbols: Get all symbols from src/models/user.ts`
- `#getDocumentSymbols: Show structure of src/components/Button.tsx`

**With explicit parameters:**

```json
{
  "tool": "#goToDefinition",
  "arguments": {
    "symbol": "foo",
    "uri": "/home/user/project/src/index.ts",
    "startLineNumber": 1,
    "endLineNumber": 200
  }
}
```

```json
{
  "tool": "#getDocumentSymbols",
  "arguments": {
    "uri": "/home/user/project/src/app.py"
  }
}
```

**Example Outputs:**

Go To Definition:
> `connect-redis` from
>
> ```javascript
> /home/user/project/server.js:2-4
>
> const session = require('express-session');
> const RedisStore = require('connect-redis').default;
> const { createClient } = require('redis');
> ```
>
> is defined at `/home/user/project/node_modules/connect-redis/dist/connect-redis.d.cts:1-46`

Get Document Symbols:
> Symbols for `/home/user/pytorch/torch/optim/adamw.py`:
>
> ```json
> [
>   {
>     "name": "__all__",
>     "kind": "Variable",
>     "hoverInformation": "...",
>     "locationLineNum": 8,
>     "definitionStartLineNumber": 8,
>     "definitionEndLineNumber": 8
>   },
>   {
>     "name": "AdamW",
>     "kind": "Class",
>     "hoverInformation": "...",
>     "locationLineNum": 11,
>     "definitionStartLineNumber": 11,
>     "definitionEndLineNumber": 194,
>     "children": [
>       {
>
>       }
>     ]
>   },
>
> ]
> ```

**Notes:**
- `uri` accepts:
  - Absolute path: `/home/user/project/src/index.ts`
  - File URI: `file:///...`
- `startLineNumber` and `endLineNumber` are 1-based and inclusive

## Chat Modes

To enable a "Symbol Navigation" chat mode in your project, add a file like `.github/chatmodes/Symbol Navigation.chatmode.md`. This chat mode guides Copilot or other LLMs to use the symbol navigation tools more effectively during conversations.

## Development

- Prerequisites: Node.js and npm installed.
- Setup:
  - `npm install`
  - Press F5 in VS Code to launch the Extension Development Host.
- Test:
  - In the dev host, open a workspace containing the target files.
  - Open Copilot Chat (agent mode) and invoke `#goToDefinition` or `#getDocumentSymbols` as shown above.

## Known Limitations

- Matches the first exact textual occurrence of the symbol before resolving definition.
- Results depend on language support and available symbols in the workspace.
- Large files or many definitions may impact performance.

## Release Notes

### 0.0.2

- Added `go-to-definition` tool (`#goToDefinition`) for finding symbol definitions in codebase and dependencies.
- Added `get-document-symbols` tool (`#getDocumentSymbols`) to retrieve all symbols in a file, including hover information (docstrings, comments, type signatures) for each symbol.
