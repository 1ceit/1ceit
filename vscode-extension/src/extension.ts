import * as vscode from 'vscode';
import * as https from 'https';
import { simpleGit } from 'simple-git';

let statusBarItem: vscode.StatusBarItem;
let updateInterval: NodeJS.Timeout | undefined;
let isEnabled = true;

export function activate(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'now-coding.options';
    const updateStatusBar = () => {
        statusBarItem.text = isEnabled ? `$(radio-tower) Now Coding` : `$(circle-slash) Now Coding (Paused)`;
        statusBarItem.tooltip = isEnabled ? `Now Coding Tracking is Active. Click for Options.` : `Now Coding Tracking is Paused. Click for Options.`;
    };

    updateStatusBar();
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    context.subscriptions.push(vscode.commands.registerCommand('now-coding.toggle', () => {
        isEnabled = !isEnabled;
        updateStatusBar();
        if (isEnabled) {
            sendUpdate();
        } else {
            sendPayload({ isIdle: true });
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('now-coding.settings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'nowCoding');
    }));

    const startCmd = vscode.commands.registerCommand('now-coding.options', async () => {
        const toggleOption = isEnabled ? '$(stop-circle) Disable Tracking' : '$(play-circle) Enable Tracking';
        const settingsOption = '$(settings-gear) Open Settings';

        const selection = await vscode.window.showQuickPick([
            { label: toggleOption, description: isEnabled ? 'Pause sending your coding status' : 'Resume sending your coding status' },
            { label: settingsOption, description: 'Configure API URL and Secret' }
        ], {
            placeHolder: 'Now Coding Options'
        });

        if (selection?.label === toggleOption) {
            vscode.commands.executeCommand('now-coding.toggle');
        } else if (selection?.label === settingsOption) {
            vscode.commands.executeCommand('now-coding.settings');
        }
    });
    context.subscriptions.push(startCmd);

    // Send update immediately
    sendUpdate();

    // Listen for window focus changes (important if they have multiple VS Code instances open)
    context.subscriptions.push(vscode.window.onDidChangeWindowState((e) => {
        if (e.focused) {
            sendUpdate();
        }
    }));

    // Set interval to update every 5 minutes if editor hasn't changed (to keep status 'active' in KV)
    updateInterval = setInterval(sendUpdate, 5 * 60 * 1000);
}

async function sendUpdate() {
    if (!isEnabled) return;

    const editor = vscode.window.activeTextEditor;

    // If no editor is open, send an explicit idle status
    if (!editor) {
        sendPayload({ isIdle: true });
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

    sendPayload({ fileName, language, gitUrl, isIdle: false });
}

function sendPayload(payload: any) {
    const config = vscode.workspace.getConfiguration('nowCoding');
    const apiUrl = config.get<string>('apiUrl');
    const apiSecret = config.get<string>('apiSecret');

    if (!apiUrl || !apiSecret) {
        console.log('Now Coding: Missing API URL or API Secret in settings.');
        return;
    }

    try {
        const data = JSON.stringify(payload);
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
