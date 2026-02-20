/* 
THIS CODE AND THE IDEA IS TAKEN FROM https://github.com/natemoo-re 
*/

import { html } from "htm/preact";
import { render } from "preact-render-to-string";
import { Player } from "../src/components/NowPlaying.ts";
import { nowPlaying } from "../src/utils/spotify.ts";
import { toBase64 } from "../src/utils/encoding.ts";

const t0 = Date.now();
const mark = (m: string) => console.log(`${Date.now() - t0}ms ${m}`);

export default {
  async fetch(request: Request) {
    mark("start");

    const {
      item = {} as any,
      is_playing: isPlaying = false,
      progress_ms: progress = 0,
    } = await nowPlaying();
    mark("nowPlaying done");

    const url = new URL(request.url, "https://github.api.1ceit.com");

    // If `open` param is present, attempt redirect
    if (url.searchParams.has("open")) {
      const location = item?.external_urls?.spotify || "https://github.api.1ceit.com";

      if (location) {
        return Response.redirect(location, 302);
      }

      return new Response(null, { status: 200 });
    }
    const { duration_ms: duration, name: track } = item ?? {};
    const { images = [] } = item?.album ?? {};

    const cover = images[images.length - 1]?.url;

    let coverImg: string | undefined;
    if (cover) {
      mark("cover fetch");
      const buf = await fetch(cover).then((res) => res.arrayBuffer());
      coverImg = `data:image/jpeg;base64,${toBase64(buf)}`;
      mark("cover done");
    }

    const artist = (item?.artists ?? [])
      .map(({ name }: { name: string }) => name)
      .join(", ");

    mark("render");
    console.log({ isPlaying, artist, track });
    const text = render(
      html`<${Player}
        ...${{
          cover: coverImg,
          artist,
          track,
          isPlaying,
          progress,
          duration,
        }}
      />`,
    );
    mark("render done");
    console.log({ text });
    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  },
};
