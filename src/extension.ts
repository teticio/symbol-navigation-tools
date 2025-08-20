// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.lm.registerTool('go-to-definition', new GoToDefinitionTool())
	);
	context.subscriptions.push(
		vscode.lm.registerTool('get-document-symbols', new GetDocumentSymbolsTool())
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }

export interface IGoToDefinitionParameters {
	symbol: string;
	uri: string;
	startLineNumber?: number;
	endLineNumber?: number;
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class GoToDefinitionTool implements vscode.LanguageModelTool<IGoToDefinitionParameters> {
	async prepareInvocation(
		options: vscode.LanguageModelToolInvocationPrepareOptions<IGoToDefinitionParameters>,
		_token: vscode.CancellationToken
	) {
		const confirmationMessages = {
			title: 'Go to definition of symbol',
			message: new vscode.MarkdownString(`Go to definition of symbol ${options.input.symbol}?`)
		};

		return {
			invocationMessage: `Going to definition of symbol ${options.input.symbol}`,
			confirmationMessages
		};
	}

	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<IGoToDefinitionParameters>,
		_token: vscode.CancellationToken
	) {
		const params = options.input ?? {};

		if (!params.symbol || !params.uri) {
			throw new Error('Invalid parameters. Symbol and URI are required.');
		}

		const uri = params.uri;
		const doc = await vscode.workspace.openTextDocument(uri);
		const startLineNumber = Math.max(1, params.startLineNumber ?? 1) - 1;
		const endLineNumber = Math.min(doc.lineCount, params.endLineNumber ?? doc.lineCount) - 1;
		const text = doc.getText();
		const regex = new RegExp(`\\b${escapeRegExp(params.symbol)}\\b`, 'g');
		let position: vscode.Position | undefined;
		let match: RegExpExecArray | null;

		while ((match = regex.exec(text)) !== null) {
			const pos = doc.positionAt(match.index);
			if (pos.line >= startLineNumber && pos.line <= endLineNumber) {
				position = pos;
				break;
			}
			if (regex.lastIndex === match.index) {
				regex.lastIndex++;
			}
		}

		if (!position) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`${params.symbol} not found in ${uri} lines ${startLineNumber + 1}-${endLineNumber + 1}`)
			]);
		}

		const symbolLineNumber = position.line;
		const contextStartLineNumber = Math.max(0, symbolLineNumber - 1) + 1;
		const contextEndLineNumber = Math.min(doc.lineCount - 1, symbolLineNumber + 1) + 1;
		const contextLines: string[] = [];

		for (let i = contextStartLineNumber - 1; i <= contextEndLineNumber - 1; i++) {
			contextLines.push(doc.lineAt(i).text);
		}

		const contextRange = contextStartLineNumber === contextEndLineNumber
			? `${contextStartLineNumber}`
			: `${contextStartLineNumber}-${contextEndLineNumber}`;
		const contextBlock = `\`\`\`${doc.languageId}\n${uri}:${contextRange}\n\n${contextLines.join('\n')}\n\`\`\``;

		const definitions = (await vscode.commands.executeCommand(
			'vscode.executeDefinitionProvider',
			vscode.Uri.parse(uri),
			position
		)) as vscode.Location | vscode.Location[] | vscode.DefinitionLink[] | undefined;

		if (!definitions || (Array.isArray(definitions) && definitions.length === 0)) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`Definition for ${params.symbol} not found`)
			]);
		}

		const definitionsArray = Array.isArray(definitions)
			? (definitions as Array<vscode.Location | vscode.DefinitionLink>)
			: [definitions];

		const definitionPaths = definitionsArray.map((definition) => {
			const isDefinitionLink = 'targetUri' in (definition as vscode.DefinitionLink);
			const definitionUri = isDefinitionLink
				? (definition as vscode.DefinitionLink).targetUri
				: (definition as vscode.Location).uri;
			const range = isDefinitionLink
				? (definition as vscode.DefinitionLink).targetRange
				: (definition as vscode.Location).range;
			const rangeStartLineNumber = range.start.line + 1;
			const rangeEndLineNumber = range.end.line + 1;
			const filePath = definitionUri.scheme === 'file' ? definitionUri.fsPath : definitionUri.toString();

			return rangeStartLineNumber === rangeEndLineNumber
				? `${filePath}:${rangeStartLineNumber}`
				: `${filePath}:${rangeStartLineNumber}-${rangeEndLineNumber}`;
		});

		return new vscode.LanguageModelToolResult([
			new vscode.LanguageModelTextPart(`\`${params.symbol}\` from\n\n${contextBlock}\n\nis defined at ${definitionPaths.join(', ')}`)
		]);
	}
}

// Based on https://github.com/juehang/vscode-mcp-server
function symbolKindToString(kind: vscode.SymbolKind): string {
	switch (kind) {
		case vscode.SymbolKind.File: return 'File';
		case vscode.SymbolKind.Module: return 'Module';
		case vscode.SymbolKind.Namespace: return 'Namespace';
		case vscode.SymbolKind.Package: return 'Package';
		case vscode.SymbolKind.Class: return 'Class';
		case vscode.SymbolKind.Method: return 'Method';
		case vscode.SymbolKind.Property: return 'Property';
		case vscode.SymbolKind.Field: return 'Field';
		case vscode.SymbolKind.Constructor: return 'Constructor';
		case vscode.SymbolKind.Enum: return 'Enum';
		case vscode.SymbolKind.Interface: return 'Interface';
		case vscode.SymbolKind.Function: return 'Function';
		case vscode.SymbolKind.Variable: return 'Variable';
		case vscode.SymbolKind.Constant: return 'Constant';
		case vscode.SymbolKind.String: return 'String';
		case vscode.SymbolKind.Number: return 'Number';
		case vscode.SymbolKind.Boolean: return 'Boolean';
		case vscode.SymbolKind.Array: return 'Array';
		case vscode.SymbolKind.Object: return 'Object';
		case vscode.SymbolKind.Key: return 'Key';
		case vscode.SymbolKind.Null: return 'Null';
		case vscode.SymbolKind.EnumMember: return 'EnumMember';
		case vscode.SymbolKind.Struct: return 'Struct';
		case vscode.SymbolKind.Event: return 'Event';
		case vscode.SymbolKind.Operator: return 'Operator';
		case vscode.SymbolKind.TypeParameter: return 'TypeParameter';
		default: return 'Unknown';
	}
}

// Based on https://github.com/juehang/vscode-mcp-server
function processHoverContent(content: any): string {
	if (typeof content === 'string') {
		return content;
	} else if (content && typeof content === 'object' && 'value' in content) {
		return content.value;
	}
	return String(content);
}

// Based on https://github.com/juehang/vscode-mcp-server
export async function getSymbolHoverInfo(
	uri: vscode.Uri,
	position: vscode.Position
): Promise<string> {
	console.info(`[getSymbolHoverInfo] Getting hover info for ${uri.toString()} at position (${position.line},${position.character})`);

	try {
		// Execute the hover provider
		const commandResult = await vscode.commands.executeCommand<vscode.Hover[]>(
			'vscode.executeHoverProvider',
			uri,
			position
		) || [];

		console.info(`[getSymbolHoverInfo] Found ${commandResult.length} hover results`);

		// Map the hover results to a more friendly format
		const contents: string[] = [];
		for (const hover of commandResult) {
			if (Array.isArray(hover.contents)) {
				contents.push(...hover.contents.map(processHoverContent));
			} else if (hover.contents) {
				contents.push(processHoverContent(hover.contents));
			}
		}

		return contents.join('\n');
	} catch (error) {
		console.error(`[getSymbolHoverInfo] Error: ${error instanceof Error ? error.message : String(error)}`);
		throw error;
	}
}

// Based on https://github.com/juehang/vscode-mcp-server
export async function getDocumentSymbols(
	uri: vscode.Uri,
	maxDepth?: number
): Promise<Array<{
	name: string;
	detail?: string;
	kind: string;
	locationLineNumber: number;
	definitionStartLineNumber: number;
	definitionEndLineNumber: number;
	depth: number;
	children?: Array<any>;
}>> {
	console.info(`[getDocumentSymbols] Getting symbols for ${uri.toString()}, maxDepth: ${maxDepth}`);

	try {
		// Execute the document symbol provider
		const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
			'vscode.executeDocumentSymbolProvider',
			uri
		) || [];

		console.info(`[getDocumentSymbols] Found ${symbols.length} top-level symbols`);

		const kindCounts: Record<string, number> = {};

		// Recursive function to process symbols and their children
		async function processSymbols(symbols: vscode.DocumentSymbol[], depth: number = 0): Promise<Array<any>> {
			const processedSymbols: Array<any> = [];

			for (const symbol of symbols) {
				// Skip if max depth exceeded
				if (maxDepth !== undefined && depth > maxDepth) {
					continue;
				}

				const kindString = symbolKindToString(symbol.kind);
				const position = new vscode.Position(symbol.selectionRange.start.line, symbol.selectionRange.start.character);

				kindCounts[kindString] = (kindCounts[kindString] || 0) + 1;

				const processedSymbol: any = {
					name: symbol.name,
					detail: symbol.detail || undefined,
					kind: kindString,
					hoverInformation: await getSymbolHoverInfo(uri, position),
					locationLineNumber: symbol.selectionRange.start.line + 1,
					definitionStartLineNumber: symbol.range.start.line + 1,
					definitionEndLineNumber: symbol.range.end.line + 1
				};

				// Recursively process children
				if (symbol.children && symbol.children.length > 0) {
					processedSymbol.children = processSymbols(symbol.children, depth + 1);
				}

				processedSymbols.push(processedSymbol);
			}

			return processedSymbols;
		}

		return processSymbols(symbols);
	} catch (error) {
		console.error(`[getDocumentSymbols] Error: ${error instanceof Error ? error.message : String(error)}`);
		throw error;
	}
}

export interface IGetDocumentSymbols {
	uri: string;
	maxDepth?: number;
}

class GetDocumentSymbolsTool implements vscode.LanguageModelTool<IGetDocumentSymbols> {
	async prepareInvocation(
		options: vscode.LanguageModelToolInvocationPrepareOptions<IGetDocumentSymbols>,
		_token: vscode.CancellationToken
	) {
		const confirmationMessages = {
			title: 'Get document symbols',
			message: new vscode.MarkdownString(`Get document symbols for ${options.input.uri}?`)
		};

		return {
			invocationMessage: `Getting document symbols for ${options.input.uri}`,
			confirmationMessages
		};
	}

	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<IGetDocumentSymbols>,
		_token: vscode.CancellationToken
	) {
		const params = options.input ?? {};

		const uri = params.uri;
		const maxDepth = params.maxDepth;

		if (!uri) {
			throw new Error('Invalid parameters. URI is required.');
		}

		const documentSymbols = await getDocumentSymbols(vscode.Uri.parse(uri), maxDepth);

		return new vscode.LanguageModelToolResult([
			new vscode.LanguageModelTextPart(`Symbols for ${uri}:\n\n\`\`\`json\n${JSON.stringify(documentSymbols, null, 2)}\n\`\`\``)
		]);
	}
}
