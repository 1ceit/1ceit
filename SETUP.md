# GitHub Profile with Live Spotify & VS Code Widgets

This repository is an aesthetic GitHub Profile README template that includes real-time SVG widgets for:
- **Spotify Now Playing** (via Spotify API)
- **VS Code Now Coding** (via a custom Extension + Vercel Database)

![Profile Preview](https://github.com/1ceit/1ceit/raw/main/README.md)

---

## How to Replicate This Profile

To use this for your own GitHub profile, fork this repository and follow the two steps below to configure your own APIs via Vercel!

### Step 1: Vercel Deployment & Database
This setup uses Vercel Serverless Functions to generate the SVGs dynamically.
1. Create a free account at [Vercel](https://vercel.com).
2. Import your forked repository as a new Vercel Project.
3. In your Vercel Project Settings > **Integrations**, add the **Upstash Redis** integration. This gives you the free database needed to store your VS Code presence.
4. In your Vercel Project Settings > **Environment Variables**, create a new variable called `VSCODE_SECRET`. Set it to a strong, random password.

### Step 2: Spotify Now Playing Setup
You need to authenticate the API with your actual Spotify account.
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/) and create an app.
2. Edit the app settings and add `http://127.0.0.1:3000/callback` to the **Redirect URIs**.
3. Copy your `Client ID` and `Client Secret`.
4. In your local terminal, run `npm install` and then `npm run setup`. Paste in your Client ID and Secret when prompted. This will generate a secret `SPOTIFY_REFRESH_TOKEN`.
5. Add all three Spotify variables (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`) to your Vercel **Environment Variables**.
6. Redeploy your Vercel app!

### Step 3: VS Code "Now Coding" Tracker Setup
Instead of relying on Discord Rich Presence, we use a private, lightweight VS Code extension that silently reports to your Vercel database!
1. Open this repository locally in VS Code.
2. Run `cd vscode-extension && npm install && npx @vscode/vsce package` to build the `.vsix` extension file.
3. In VS Code, go to Extensions > Click the `...` menu > **"Install from VSIX..."** and select the `.vsix` file you just generated.
4. Open your VS Code Settings (`Cmd/Ctrl + ,`) and search for **Now Coding**.
5. Set the **Api Url** to your vercel deployment URL (e.g., `https://my-vercel-app.vercel.app/api/vscode-status`).
6. Set the **Api Secret** to the `VSCODE_SECRET` password you created in Step 1.

You are done! Open a file in VS Code and your GitHub Profile README should update!

---
*Spotify widget heavily inspired by [natemoo-re](https://github.com/natemoo-re/natemoo-re).*
