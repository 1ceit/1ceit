import { kv } from '@vercel/kv';

export default {
    async fetch(request: Request) {
        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        const secret = request.headers.get('Authorization');
        if (secret !== `Bearer ${process.env.VSCODE_SECRET}`) {
            return new Response('Unauthorized', { status: 401 });
        }

        try {
            const data = await request.json() as { fileName: string, language: string, gitUrl?: string };

            await kv.set('vscode_status', {
                fileName: data.fileName,
                language: data.language,
                gitUrl: data.gitUrl,
                updatedAt: Date.now()
            });

            return new Response('OK', { status: 200 });
        } catch (e) {
            return new Response('Bad Request', { status: 400 });
        }
    }
};
