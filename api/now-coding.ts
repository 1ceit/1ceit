import { html } from 'htm/preact';
import { render } from 'preact-render-to-string';
import { kv } from '@vercel/kv';
import { NowCoding } from '../src/components/NowCoding.ts';

export default {
    async fetch(request: Request) {
        const status = await kv.get<{ fileName: string, language: string, updatedAt: number }>('vscode_status');

        let isCoding = false;
        let fileName = "";
        let language = "";

        // Consider the user active if updated in the last 15 minutes
        if (status && (Date.now() - status.updatedAt < 15 * 60 * 1000)) {
            isCoding = true;
            fileName = status.fileName;
            language = status.language;
        }

        const iconMap: Record<string, string> = {
            javascript: 'js',
            typescript: 'ts',
            javascriptreact: 'jsx',
            typescriptreact: 'tsx',
            python: 'python',
            java: 'java',
            c: 'c',
            cpp: 'cpp',
            csharp: 'csharp',
            go: 'go',
            rust: 'rust',
            html: 'html',
            css: 'css',
            scss: 'scss',
            markdown: 'markdown',
            php: 'php',
            ruby: 'ruby',
            swift: 'swift',
            vue: 'vue',
            svelte: 'svelte',
            dart: 'dart',
            json: 'json'
        };

        const iconId = isCoding && language ? (iconMap[language.toLowerCase()] || 'vscode') : 'vscode';
        const rawIconUrl = `https://raw.githubusercontent.com/iCrawl/discord-vscode/master/assets/icons/${iconId}.png`;

        const iconBuf = await fetch(rawIconUrl).then(res => res.arrayBuffer());
        const iconBase64 = `data:image/png;base64,${Buffer.from(iconBuf).toString('base64')}`;

        const text = render(
            html`<${NowCoding}
        isCoding=${isCoding}
        fileName=${fileName}
        language=${language}
        iconUrl=${iconBase64}
      />`
        );

        return new Response(text, {
            status: 200,
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        });
    }
};
