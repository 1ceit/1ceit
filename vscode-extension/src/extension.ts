import * as vscode from 'vscode';
import * as https from 'https';
import { simpleGit } from 'simple-git';

let statusBarItem: vscode.StatusBarItem;
let updateInterval: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'now-coding.start';
    statusBarItem.text = `$(sync) Now Coding: Active`;
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    const startCmd = vscode.commands.registerCommand('now-coding.start', () => {
        vscode.window.showInformationMessage('Now Coding is running and syncing to ' + vscode.workspace.getConfiguration('nowCoding').get('apiUrl'));
    });
    context.subscriptions.push(startCmd);

    // Send update immediately
    sendUpdate();

    // Listen for changes
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(sendUpdate));

    // Set interval to update every 5 minutes if editor hasn't changed (to keep status 'active' in KV)
    updateInterval = setInterval(sendUpdate, 5 * 60 * 1000);
}

async function sendUpdate() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const fileName = editor.document.fileName.split(/[/\\]/).pop() || 'Unknown';
    const language = editor.document.languageId;

    const config = vscode.workspace.getConfiguration('nowCoding');
    const apiUrl = config.get<string>('apiUrl');
    const apiSecret = config.get<string>('apiSecret');

    if (!apiUrl || !apiSecret) {
        console.log('Now Coding: Missing API URL or API Secret in settings.');
        return;
    }

    let gitUrl: string | undefined = undefined;
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const git = simpleGit(workspaceFolders[0].uri.fsPath);
            const remotes = await git.getRemotes(true);
            const origin = remotes.find(r => r.name === 'origin') || remotes[0];
            if (origin && origin.refs.fetch) {
                let url = origin.refs.fetch;
                if (url.startsWith('git@')) {
                    url = url.replace(':', '/').replace('git@', 'https://');
                }
                if (url.endsWith('.git')) {
                    url = url.slice(0, -4);
                }
                gitUrl = url;
            }
        }
    } catch (e) {
        // Ignore git errors
    }

    try {
        const data = JSON.stringify({ fileName, language, gitUrl });
        const url = new URL(apiUrl);

        const req = https.request({
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiSecret}`,
                'Content-Length': Buffer.byteLength(data)
            }
        });

        req.on('error', (e) => {
            console.error('Failed to sync now tracking', e);
        });

        req.write(data);
        req.end();
    } catch (e) {
        console.error(e);
    }
}

export function deactivate() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
}
