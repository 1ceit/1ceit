import * as vscode from 'vscode';
import * as http from 'http';
import * as https from 'https';
import { simpleGit } from 'simple-git';

let statusBarItem: vscode.StatusBarItem;
let updateInterval: NodeJS.Timeout | undefined;
let inactivityTimer: NodeJS.Timeout | undefined;
let isEnabled = true;

const INACTIVITY_DELAY_MS = 10 * 60 * 1000; // 10 minutes

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

    // Send update immediately and start the inactivity countdown
    sendUpdate();
    resetInactivityTimer();

    // Listen for window focus changes — only re-broadcast on focus gain; blur does nothing
    context.subscriptions.push(vscode.window.onDidChangeWindowState((e) => {
        if (e.focused) {
            sendUpdate();
        }
    }));

    // Listen for tab switching — broadcast instantly and reset inactivity timer
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
        sendUpdate();
        resetInactivityTimer();
    }));

    // Listen for file saving — broadcast instantly and reset inactivity timer
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(() => {
        sendUpdate();
        resetInactivityTimer();
    }));

    // Listen for text edits — silently reset inactivity timer without broadcasting
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => {
        resetInactivityTimer();
    }));

    // Keepalive heartbeat every 30s so the API knows VS Code is still open
    // Does NOT reset the inactivity timer — only real user activity does that
    updateInterval = setInterval(sendUpdate, 30 * 1000);
}

function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        sendPayload({ isIdle: true });
        inactivityTimer = undefined;
    }, INACTIVITY_DELAY_MS);
}

async function sendUpdate() {
    if (!isEnabled) return;

    const editor = vscode.window.activeTextEditor;

    // If no editor is open, let the inactivity timer handle idle — don't send immediately
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
        const isHttps = url.protocol === 'https:';
        const transport = isHttps ? https : http;
        const port = url.port ? parseInt(url.port) : (isHttps ? 443 : 80);

        const req = transport.request({
            hostname: url.hostname,
            port,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiSecret}`,
                'Content-Length': Buffer.byteLength(data)
            }
        });

        req.on('error', (e) => {
            console.error('Now Coding: Failed to sync', e);
        });

        req.write(data);
        req.end();
    } catch (e) {
        console.error(e);
    }
}

export function deactivate() {
    if (updateInterval) clearInterval(updateInterval);
    if (inactivityTimer) clearTimeout(inactivityTimer);
}
