/**
 * Main entry
 */
import * as vscode from 'vscode';
import * as linkify from 'linkifyjs';
import getPreview from './preview';
import { info, debug } from './logging';
import { Maybe, parseConceptLink } from './utils';
import { fetchHTML } from './network';

function getHoveredLink(document: vscode.TextDocument, position: vscode.Position): Maybe<string> {
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

    const preview = await getPreview(url);
    if (!preview) return;

    const viewCommand = `command:extension.openSpecWebView?${JSON.stringify(encodeURIComponent(url))}`;

    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(preview);
    markdown.appendMarkdown(`\n\n[Open in Side View](${viewCommand})`);
    markdown.isTrusted = true;
    markdown.supportHtml = true;

    return new vscode.Hover(markdown);
}

function openWebViewPanel(url: string) {
    const panel = vscode.window.createWebviewPanel(
        'specView',
        'Specification View',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );
    const { origin } = parseConceptLink(url) ?? {};
    if (!origin) return;
    info("extension", `Opening webview panel for ${origin}`);
    fetchHTML(origin).then(html => {
        panel.webview.html = html + `
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                window.location.hash = "${url.split('#')[1]}";
            });
        </script>
        `;
    });
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
