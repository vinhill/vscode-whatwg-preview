/**
 * Main entry
 */
import * as vscode from 'vscode';
import * as linkify from 'linkifyjs';
import { getPreview, parseConceptLink } from './preview';
import { debug } from './logging';
import { Maybe } from './utils';

function getHoveredLink(document: vscode.TextDocument, position: vscode.Position) : Maybe<string> {
    const lineText = document.lineAt(position.line).text;

    const links = linkify.find(lineText).filter(link => {
        const linkRange = new vscode.Range(
            position.line,
            link.start,
            position.line,
            link.end
        );
        return linkRange.contains(position);
    });

    return links.length == 1 ? links[0].value : undefined;
}

async function provideHover(document: vscode.TextDocument, position: vscode.Position) {
    const url = getHoveredLink(document, position);
    if (!url) return;
    if (!url.includes('whatwg.org')) return;
    
    const text = await getPreview(url);
    if (!text) return;

    const { origin, concept } = parseConceptLink(url) ?? {};
    if (!origin || !concept) return;

    const multipageUrl = `https://${origin}/multipage/#${concept}`;
    const viewCommand = `command:extension.openSpecWebView?${
        JSON.stringify(encodeURIComponent(multipageUrl))}`;
    
    const markdown = new vscode.MarkdownString();
    markdown.appendText(text);
    markdown.appendMarkdown(`\n\n[Open in Side View](${viewCommand})`);
    markdown.isTrusted = true;

    return new vscode.Hover(markdown);
}

function openWebViewPanelOld(url: string) {
    const panel = vscode.window.createWebviewPanel(
        'specView',
        'Specification View',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );
    panel.webview.html = `<iframe src="${url}" width="100%" height="100%" style="border: none;"></iframe>`;
}

function openWebViewPanel(url: string) {
    // TODO does this work?
    const panel = vscode.window.createWebviewPanel(
        'specView',
        'Specification View',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );

    const isDarkMode = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
    const darkModeStyle = isDarkMode ? 'background-color: #1e1e1e; color: white;' : '';

    panel.webview.html = `
        <html>
        <head>
            <style>
                body { margin: 0; ${darkModeStyle} }
                iframe { width: 100%; height: 100%; border: none; }
                @media (prefers-color-scheme: dark) {
                    body { background-color: #1e1e1e; color: white; }
                }
            </style>
        </head>
        <body>
            <iframe src="${url}"></iframe>
        </body>
        </html>
    `;
}

export function activate(context: vscode.ExtensionContext) {
    debug("extension", 'Extension activated');
    
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { scheme: 'file' }, { provideHover }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'extension.openSpecWebView', (url: string) => openWebViewPanel(url)
        )
    );
}
