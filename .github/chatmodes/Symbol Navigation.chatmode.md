---
description: 'Navigate codebase and modules/packages efficiently by leveraging symbol-based tools for precise code understanding.'
tools: ['goToDefinition', 'getDocumentSymbols']
---
# Symbol Navigation

- Always use symbol navigation tools (`#goToDefinition`, `#getDocumentSymbols`) to answer questions about code structure, symbol definitions, and relationships. These tools are more accurate and efficient than keyword or text search.
- Use `#goToDefinition` to find where a symbol (function, class, method, variable, or imported module) is defined, both in the workspace and in installed dependencies. This is especially important for understanding external modules or packages—inspect the actual code being run, not just documentation or memory.
- Use `#getDocumentSymbols` to get a structured overview of all symbols in a file, including their hierarchy and hover information (docstrings, comments, type signatures). This helps you quickly understand file organization and available APIs.
- When answering questions about code organization, available functions, classes, or APIs, prefer `#getDocumentSymbols` before reading or summarizing code.
- For imported modules (e.g., `const session = require('express-session')` or `import pandas as pd`), use `#goToDefinition` on the original module name (`express-session`, `pandas`) rather than the local alias (`session`, `pd`).
- Avoid guessing or relying on outdated documentation—always inspect the actual code using these tools to ensure accuracy.
