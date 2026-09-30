# Now Coding for Visual Studio Code

Show what you're coding on your GitHub profile with [Readme Widgets](https://readmewidgets.dev).

When you switch files or save, the extension sends your Now Coding widget three things: the file's name, its language and the repository link. After 10 minutes without typing, it shows you as idle.

### Setup
1. Sign in at [readmewidgets.dev](https://readmewidgets.dev) and open **Now Coding**.
2. Click **Connect VS Code** and confirm in VS Code.

To set it up by hand instead, run **Now Coding: Enter Secret** from the Command Palette (`Cmd/Ctrl + Shift + P`) and paste the secret from the dashboard.

### Commands
- **Now Coding: Enter Secret**: paste a new secret.
- **Now Coding: Toggle Tracking**: pause or resume sharing. Clicking **Now Coding** in the status bar also has this.
- **Now Coding: Open Dashboard**: open the widget editor.

### Settings
- `nowCoding.apiSecret`: your secret from the dashboard.
- `nowCoding.apiUrl`: where your status is sent. Leave this as is unless you use Readme Widgets on a different domain, like `https://widgets.coreyartz.com/api/vscode-status`.
