/* 
THIS CODE AND THE IDEA IS TAKEN FROM https://github.com/natemoo-re 
*/
import { html } from "htm/preact";
import { render } from "preact-render-to-string";
import { Track } from "../src/components/Track.ts";
import { topTrack } from "../src/utils/spotify.ts";
import { toBase64 } from "../src/utils/encoding.ts";

export default {
  async fetch(request: Request) {
    const url = new URL(request.url, "https://github.api.1ceit.com");
    const i = url.searchParams.get("i");

    const index = Number.parseInt(i ?? "", 10);
    const item = await topTrack({ index });

    if (!item) {
      return new Response(null, { status: 404 });
    }

    // If `open` is present (any value, including empty), redirect if possible.
    if (url.searchParams.has("open")) {
      const location = item?.external_urls?.spotify;

      if (location) {
        return Response.redirect(location, 302);
      }

      return new Response(null, { status: 200 });
    }

    const { name: track } = item;
    const { images = [] } = item.album ?? {};
    const cover = images[images.length - 1]?.url;

    let coverImg: string | undefined = undefined;
    if (cover) {
      const resp = await fetch(cover);
      const buff = await resp.arrayBuffer();
      coverImg = `data:image/jpeg;base64,${toBase64(buff)}`;
    }

    const artist = (item.artists ?? []).map(({ name }) => name).join(", ");

    const text = render(
      html`<${Track}
        index=${index}
        cover=${coverImg}
        artist=${artist}
        track=${track}
      />`,
    );
    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, s-maxage=259200, stale-while-revalidate=2592000",
      },
    });
  },
};
