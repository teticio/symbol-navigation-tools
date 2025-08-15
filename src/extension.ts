// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.lm.registerTool('go-to-definition', new GotoDefinitionTool())
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }

export interface IGotoDefinitionParameters {
	symbol: string;
	uri: string;
	startLineNumber?: number;
	endLineNumber?: number;
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class GotoDefinitionTool implements vscode.LanguageModelTool<IGotoDefinitionParameters> {
	async prepareInvocation(
		options: vscode.LanguageModelToolInvocationPrepareOptions<IGotoDefinitionParameters>,
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
		options: vscode.LanguageModelToolInvocationOptions<IGotoDefinitionParameters>,
		_token: vscode.CancellationToken
	) {
		const params = options.input ?? {};

		if (!params.symbol || !params.uri) {
			throw new Error('Invalid parameters. Symbol and URI are required.');
		}

		const uri = params.uri;
		const doc = await vscode.workspace.openTextDocument(uri);
		const start = Math.max(1, params.startLineNumber ?? 1) - 1;
		const end = Math.min(doc.lineCount, params.endLineNumber ?? doc.lineCount) - 1;
		const text = doc.getText();
		const re = new RegExp(`\\b${escapeRegExp(params.symbol)}\\b`, 'g');
		let position: vscode.Position | undefined;
		let m: RegExpExecArray | null;

		while ((m = re.exec(text)) !== null) {
			const pos = doc.positionAt(m.index);
			if (pos.line >= start && pos.line <= end) {
				position = pos;
				break;
			}
			if (re.lastIndex === m.index) {
				re.lastIndex++;
			}
		}

		if (!position) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`${params.symbol} not found in ${uri} lines ${start + 1}-${end + 1}`)
			]);
		}

		const defs = (await vscode.commands.executeCommand(
			'vscode.executeDefinitionProvider',
			vscode.Uri.parse(uri),
			position
		)) as vscode.Location | vscode.Location[] | vscode.DefinitionLink[] | undefined;

		if (!defs || (Array.isArray(defs) && defs.length === 0)) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`Definition for ${params.symbol} not found`)
			]);
		}

		const defsArray = Array.isArray(defs)
			? (defs as Array<vscode.Location | vscode.DefinitionLink>)
			: [defs];

		const paths = defsArray.map((d) => {
			const isLink = 'targetUri' in (d as vscode.DefinitionLink);
			const uri = isLink
				? (d as vscode.DefinitionLink).targetUri
				: (d as vscode.Location).uri;
			const range = isLink
				? (d as vscode.DefinitionLink).targetRange
				: (d as vscode.Location).range;
			const startLine = range.start.line + 1;
			const endLine = range.end.line + 1;
			const base = uri.scheme === 'file' ? uri.fsPath : uri.toString();

			return startLine === endLine
				? `${base}:${startLine}`
				: `${base}:${startLine}-${endLine}`;
		});

		return new vscode.LanguageModelToolResult([
			new vscode.LanguageModelTextPart(`${params.symbol} is defined at ${paths}`)
		]);
	}
}
