import * as vscode from 'vscode';
import * as http from 'http';
import * as https from 'https';
import { simpleGit } from 'simple-git';

const DEFAULT_API_URL = 'https://readmewidgets.dev/api/vscode-status';
const INACTIVITY_DELAY_MS = 10 * 60 * 1000; // 10 minutes

type SyncState = 'setup' | 'active' | 'paused' | 'unauthorized' | 'offline';

let statusBarItem: vscode.StatusBarItem;
let updateInterval: NodeJS.Timeout | undefined;
let inactivityTimer: NodeJS.Timeout | undefined;
let isEnabled = true;
let syncState: SyncState = 'setup';
// Only warn once per session about a rejected secret
let warnedUnauthorized = false;

function getConfig() {
    const config = vscode.workspace.getConfiguration('nowCoding');
    return {
        apiUrl: config.get<string>('apiUrl') || DEFAULT_API_URL,
        apiSecret: (config.get<string>('apiSecret') || '').trim(),
    };
}

/** The dashboard page for the site the extension is sending to. */
function dashboardUrl(): string {
    try {
        return `${new URL(getConfig().apiUrl).origin}/dashboard/nowcoding`;
    } catch {
        return `${new URL(DEFAULT_API_URL).origin}/dashboard/nowcoding`;
    }
}

function updateStatusBar() {
    const labels: Record<SyncState, [string, string]> = {
        setup: ['$(plug) Now Coding: Set Up', 'Now Coding isn’t connected yet. Click to enter your secret.'],
        active: ['$(radio-tower) Now Coding', 'Now Coding is sharing your status. Click for options.'],
        paused: ['$(circle-slash) Now Coding (Paused)', 'Now Coding is paused. Click for options.'],
        unauthorized: ['$(warning) Now Coding', 'Your secret wasn’t accepted. Click to enter it again.'],
        offline: ['$(cloud-offline) Now Coding', 'Couldn’t reach the server. Retrying every 30 seconds.'],
    };
    const state: SyncState = !isEnabled ? 'paused' : syncState;
    [statusBarItem.text, statusBarItem.tooltip] = labels[state];
}

function setSyncState(state: SyncState) {
    syncState = state;
    updateStatusBar();
}

async function promptForSecret() {
    const secret = await vscode.window.showInputBox({
        title: 'Now Coding: Enter Secret',
        prompt: `Copy your secret from ${dashboardUrl()}`,
        placeHolder: 'Paste your secret…',
        password: true,
        ignoreFocusOut: true,
    });
    if (!secret?.trim()) return;
    // Saving triggers onDidChangeConfiguration, which sends an update
    await vscode.workspace
        .getConfiguration('nowCoding')
        .update('apiSecret', secret.trim(), vscode.ConfigurationTarget.Global);
}

/** Handles vscode://1ceit.vscode-now-coding/connect?secret=…&url=… from the dashboard's Connect button. */
async function handleUri(uri: vscode.Uri) {
    if (uri.path !== '/connect') return;
    const params = new URLSearchParams(uri.query);
    const secret = params.get('secret')?.trim();
    const apiUrl = params.get('url')?.trim() || DEFAULT_API_URL;
    if (!secret) return;

    let target: URL;
    try {
        target = new URL(apiUrl);
    } catch {
        vscode.window.showErrorMessage('Now Coding: That connect link has an invalid address.');
        return;
    }
    const isLocal = target.hostname === 'localhost' || target.hostname === '127.0.0.1';
    if (target.protocol !== 'https:' && !isLocal) {
        vscode.window.showErrorMessage('Now Coding: Connect links must use https.');
        return;
    }

    // Any website can open these links, so the user confirms where their status will go
    const choice = await vscode.window.showInformationMessage(
        `Connect Now Coding to ${target.host}?`,
        {
            modal: true,
            detail: 'Your open file’s name, its language and the repository link will be sent to this site while you code.',
        },
        'Connect',
    );
    if (choice !== 'Connect') return;

    const config = vscode.workspace.getConfiguration('nowCoding');
    // Keep the default when it matches so future default changes still apply
    await config.update(
        'apiUrl',
        apiUrl === DEFAULT_API_URL ? undefined : apiUrl,
        vscode.ConfigurationTarget.Global,
    );
    await config.update('apiSecret', secret, vscode.ConfigurationTarget.Global);
    isEnabled = true;
    updateStatusBar();
    vscode.window.showInformationMessage('Now Coding is connected. Your dashboard will update in a few seconds.');
}

export function activate(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'now-coding.options';
    setSyncState(getConfig().apiSecret ? 'active' : 'setup');
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    context.subscriptions.push(vscode.window.registerUriHandler({ handleUri }));

    context.subscriptions.push(vscode.commands.registerCommand('now-coding.connect', promptForSecret));

    context.subscriptions.push(vscode.commands.registerCommand('now-coding.dashboard', () => {
        vscode.env.openExternal(vscode.Uri.parse(dashboardUrl()));
    }));

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

    context.subscriptions.push(vscode.commands.registerCommand('now-coding.options', async () => {
        const needsSecret = syncState === 'setup' || syncState === 'unauthorized';
        const items = needsSecret
            ? [
                { label: '$(key) Enter Secret', description: 'Paste the secret from your dashboard', id: 'connect' },
                { label: '$(link-external) Open Dashboard', description: dashboardUrl(), id: 'dashboard' },
                { label: '$(settings-gear) Open Settings', description: 'Change the server address', id: 'settings' },
            ]
            : [
                isEnabled
                    ? { label: '$(stop-circle) Pause Tracking', description: 'Stop sharing your coding status', id: 'toggle' }
                    : { label: '$(play-circle) Resume Tracking', description: 'Start sharing your coding status again', id: 'toggle' },
                { label: '$(link-external) Open Dashboard', description: dashboardUrl(), id: 'dashboard' },
                { label: '$(key) Change Secret', description: 'Paste a new secret', id: 'connect' },
                { label: '$(settings-gear) Open Settings', description: 'Change the server address', id: 'settings' },
            ];
        const choice = await vscode.window.showQuickPick(items, {
            placeHolder: needsSecret ? 'Connect Now Coding' : 'Now Coding Options',
        });
        if (choice) vscode.commands.executeCommand(`now-coding.${choice.id}`);
    }));

    // A new secret or address (from Settings, Enter Secret or a connect link) applies right away
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
        if (!e.affectsConfiguration('nowCoding')) return;
        warnedUnauthorized = false;
        if (!getConfig().apiSecret) {
            setSyncState('setup');
            return;
        }
        sendUpdate({ force: true });
    }));

    if (!getConfig().apiSecret && !context.globalState.get('nowCoding.setupPrompted')) {
        context.globalState.update('nowCoding.setupPrompted', true);
        vscode.window
            .showInformationMessage(
                'Now Coding needs your secret from the Readme Widgets dashboard to share your status.',
                'Open Dashboard',
                'Enter Secret',
            )
            .then((choice) => {
                if (choice === 'Open Dashboard') vscode.commands.executeCommand('now-coding.dashboard');
                if (choice === 'Enter Secret') vscode.commands.executeCommand('now-coding.connect');
            });
    }

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

async function sendUpdate({ force = false } = {}) {
    if (!isEnabled) return;

    if (!getConfig().apiSecret) {
        setSyncState('setup');
        return;
    }

    const editor = vscode.window.activeTextEditor;

    // If no editor is open, let the inactivity timer handle idle. Right after connecting an idle
    // status is still sent so the dashboard sees the extension.
    if (!editor) {
        if (force) sendPayload({ isIdle: true });
        return;
    }

    const fileName = editor.document.fileName.split(/[/\\]/).pop() || 'Unknown';
    const language = editor.document.languageId;

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

function handleResponse(statusCode: number | undefined) {
    if (statusCode === 401) {
        setSyncState('unauthorized');
        if (warnedUnauthorized) return;
        warnedUnauthorized = true;
        vscode.window
            .showWarningMessage(
                'Now Coding: Your secret wasn’t accepted. It may have been regenerated on the dashboard.',
                'Enter Secret',
                'Open Dashboard',
            )
            .then((choice) => {
                if (choice === 'Enter Secret') vscode.commands.executeCommand('now-coding.connect');
                if (choice === 'Open Dashboard') vscode.commands.executeCommand('now-coding.dashboard');
            });
        return;
    }
    setSyncState(statusCode && statusCode < 400 ? 'active' : 'offline');
}

function sendPayload(payload: Record<string, unknown>) {
    const { apiUrl, apiSecret } = getConfig();

    if (!apiSecret) {
        setSyncState('setup');
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
        }, (res) => {
            handleResponse(res.statusCode);
            res.resume();
        });

        req.on('error', (e) => {
            console.error('Now Coding: Failed to sync', e);
            setSyncState('offline');
        });

        req.write(data);
        req.end();
    } catch (e) {
        console.error(e);
        setSyncState('offline');
    }
}

export function deactivate() {
    if (updateInterval) clearInterval(updateInterval);
    if (inactivityTimer) clearTimeout(inactivityTimer);
}
