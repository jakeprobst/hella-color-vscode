import * as vscode from 'vscode';

const COLORS = ["#80FF00", "#FF4040", "#90a0f0", "#e04099", "#a0a080", "#88ff88",
	"#C04000", "#c08040", "#FF8080", "#FFC0C0", "#FFFF80", "#40C000",
	"#40C0C0", "#00C080", "#80c040", "#00ffc0", "#c0ff40", "#80FFFF",
	"#a0a0ff", "#bfda44", "#bdafeb", "#bdefab", "#C080C0", "#dd4088",
	"#ffc000", "#ffff80", "#c08080", "#808080", "#bbbbbb", "#9099ff",
	"#e0e0e0"];

let TEXT_DECORATIONS: vscode.TextEditorDecorationType[] = [];
let STRING_DECORATION = vscode.window.createTextEditorDecorationType({
	color: "#9cdcfeff",
});
let COMMENT_DECORATION = vscode.window.createTextEditorDecorationType({
	color: "#6a9955",
});

export function activate(context: vscode.ExtensionContext) {
	TEXT_DECORATIONS = COLORS.map((color) => {
		return vscode.window.createTextEditorDecorationType({
			color: color
		});
	});
	let disposable = vscode.commands.registerCommand('extension.hellaColor', () => {
		vscode.window.showInformationMessage('Hella World!');
		
		let editor = vscode.window.activeTextEditor!;
		hellacolor(editor);
	});
	context.subscriptions.push(disposable);

	vscode.window.onDidChangeActiveTextEditor((editor) => {
		hellacolor(editor);
	}, null, context.subscriptions);

	let timeout: NodeJS.Timeout | undefined = undefined;
	vscode.workspace.onDidChangeTextDocument(
		function (event) {
			var editor = vscode.window.activeTextEditor;
			if (editor && event.document === editor.document) {
				if (timeout) {
					clearTimeout(timeout);
				}
				timeout = setTimeout(() => {
					hellacolor(editor);
				}, 200);
			}
		},
		null,
		context.subscriptions
	);
}

// this method is called when your extension is deactivated
export function deactivate() { }


function colorhash(str: string) {
	let hash = 0;
	/*for (let i = 0; i < str.length; i++) {
		hash ^= str.charCodeAt(i);
	}*/
	for (let i = 0; i < str.length; i++) {
		if (i % 3 === 0) {
			hash += str.charCodeAt(i);
		}
		if (i % 3 === 1) {
			hash -= str.charCodeAt(i);
		}
		if (i % 3 === 2) {
			hash *= str.charCodeAt(i);
		}
	}

	return hash;
}

//function hellacolor(editor: vscode.TextEditor | undefined, text_range: vscode.Range) {
function hellacolor(editor: vscode.TextEditor | undefined) {
	let regex = vscode.workspace.getConfiguration("hellacolor").get("regex", "")!;
	//let text = editor!.document.getText(text_range);
	let text = editor!.document.getText();

	let rx = RegExp(regex, "g");

	//let ranges = new Map();
	let ranges: vscode.Range[][] = [];
	for (let i = 0; i < TEXT_DECORATIONS.length; i++) {
		ranges.push([]);
	}

	let token = undefined;
	while ((token = rx.exec(text))!) {
		let index = Math.abs(colorhash(token![0]) % TEXT_DECORATIONS.length);
		//console.log("token", token![0], token!.index, '->', token!.index + token![0].length, index);
		let range = new vscode.Range(
			//editor!.document.positionAt(token!.index).translate(text_range.start),
			//editor!.document.positionAt(token!.index + token![0].length).translate(text_range.start.line, text_range.start.character));
			editor!.document.positionAt(token!.index),
			editor!.document.positionAt(token!.index + token![0].length));
		/*if (ranges.has(index)) {
			let tokenrange = ranges.get(index);
			tokenrange.push(range);
		}
		else {
			ranges.set(index, [range]);
		}*/
		ranges[index].push(range);
	}

	ranges.forEach((v, k) => {
		editor!.setDecorations(TEXT_DECORATIONS[k], v);
	});

	let comment_rx = new RegExp("//.*$", "g");
	let comment_ranges = [];
	while ((token = comment_rx.exec(text))!) {
		comment_ranges.push(new vscode.Range(
			editor!.document.positionAt(token!.index),
			editor!.document.positionAt(token!.index + token![0].length)));
	}
	let bcomment_rx = new RegExp("\\/\\*.*?\\*\\/", "gm");
	while ((token = bcomment_rx.exec(text))!) {
		comment_ranges.push(new vscode.Range(
			editor!.document.positionAt(token!.index),
			editor!.document.positionAt(token!.index + token![0].length)));
	}
	editor!.setDecorations(COMMENT_DECORATION, comment_ranges);

	let string_rx = /"([^"\\\n]*(\\.[^"\\]*)*)"|\'([^\'\\\n]*(\\.[^\'\\]*)*)\'/gm;
	let string_ranges = [];
	while ((token = string_rx.exec(text))!) {
		string_ranges.push(new vscode.Range(
			editor!.document.positionAt(token!.index),
			editor!.document.positionAt(token!.index + token![0].length)));
	}
	editor!.setDecorations(STRING_DECORATION, string_ranges);



}
