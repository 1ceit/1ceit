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

        const text = render(
            html`<${NowCoding}
        isCoding=${isCoding}
        fileName=${fileName}
        language=${language}
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
