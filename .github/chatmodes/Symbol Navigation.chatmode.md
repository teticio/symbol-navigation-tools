---
description: 'Navigate codebase and modules / packages more effectively by finding and using symbols.'
tools: ['goToDefinition', 'getDocumentSymbols']
---
# Symbol Navigation

- When working with a large codebase, prefer to use symbol navigation tools like `#goToDefinition` and `#getDocumentSymbols` to quickly find and jump to relevant code sections. This can be more much effective than simply searching for keywords.
- To answer queries about imported modules invoke the `#goToDefinition` tool to find the code that is actually installed and being run, rather than using websearch or relying on memory which may refer to different versions of the code.
  - IMPORTANT: Bear in mind that `const session = require('express-session');` creates a symbol called `session` locally. In this case you should go to the definition of `express-session` instead of `session`. Similarly for `import pandas as pd` in Python: you should go to the definition of `pandas`, not `pd`.
