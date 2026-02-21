# Now Coding for Visual Studio Code

Bring your active coding sessions directly to your GitHub Profile! 

**Now Coding** is a lightweight Visual Studio Code extension that runs silently in the background and broadcasts your current activity—the file you are editing and your programming language—directly to a custom Vercel API. This allows you to display a beautiful, dynamic "Now Coding" SVG widget on your GitHub README.

### Features
**Real-time Status:** Syncs your currently active file and language directly to a Vercel KV store in the background.
**Git Repository Detection:** Automatically detects your active Git repository and links your GitHub widget directly to it.
**Icons:** Renders the exact same beautiful VS Code language icons seen on Discord Rich Presence.
**Lightweight:** Uses the VS Code API to transmit tiny JSON payloads, preserving your CPU and battery.

### How to use
1. Install the extension using the `.vsix` package: `code --install-extension vscode-now-coding-1.0.0.vsix`
2. Open VS Code Settings (`Cmd` + `,`), search for **Now Coding**.
3. Input your active Vercel API URL and Secret API Token to activate the extension.
4. Keep coding and watch your GitHub Profile update!
