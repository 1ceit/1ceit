import { kv } from '@vercel/kv';

export default {
    async fetch(request: Request) {
        // Increment the view counter in Vercel KV
        const views = await kv.incr('readme_views');

        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="24" viewBox="0 0 120 24">
  <style>
    .bg { fill: #24292e; }
    .text { fill: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; }
    @media (prefers-color-scheme: dark) {
      .bg { fill: #0d1117; stroke: #30363d; stroke-width: 1px; }
      .text { fill: #c9d1d9; }
    }
  </style>
  <rect class="bg" width="120" height="24" rx="4" />
  <circle cx="16" cy="12" r="4" fill="#1DB954" />
  <text class="text" x="28" y="16">Views: ${views}</text>
</svg>`;

        return new Response(svg, {
            status: 200,
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0" // Prevent GitHub Camo from caching the view count
            }
        });
    }
};
