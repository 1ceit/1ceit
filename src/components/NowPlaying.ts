import { html } from 'htm/preact';
import ReadmeImg from "./ReadmeImg.ts";
import Text from "./Text.ts";

export interface Props {
  cover?: string;
  track: string;
  artist: string;
  progress?: number | null;
  duration: number;
  isPlaying: boolean;
}

export const Player = ({
  cover,
  track,
  artist,
  progress,
  duration,
  isPlaying,
}) => {
  return html`
    <${ReadmeImg} width="540" height="64">
      <style>${css}</style>
      <div
        class="${isPlaying ? 'disabled' : 'active'}"
        style=${{
          "--duration": duration,
          "--progress": progress,
          display: "flex",
          alignItems: "center",
          paddingTop: 8,
          paddingLeft: 4,
        }}
      >
        <${Text}
          style=${{ width: "16px", marginRight: "16px" }}
          size="large"
          weight="bold"
        >
          ${isPlaying ? "▶" : ""}
        </${Text}>
        <img id="cover" src="${cover ?? undefined}" width="48" height="48" />
        <div
          style=${{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            marginTop: -4,
            marginLeft: 8,
          }}
        >
          <${Text} id="track" weight="bold">
            ${track ?? ''}
          </${Text}>
          <${Text} id="artist" color="${!track ? "gray" : undefined}">
            ${artist ?? "Nothing playing..."}
          </${Text}>
          ${track ? html`
            <div class="progress-bar">
              <div id="progress" class="${isPlaying ? "playing" : "paused"}" />
            </div>
          ` : ''}
        </div>
      </div>
    </${ReadmeImg}>
  `;
};

const css = `
  .paused { 
    animation-play-state: paused !important;
    background: #e1e4e8 !important;
  }

  img:not([src]) {
    content: url("data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==");
    background: #FFF;
    border: 1px solid #e1e4e8;
  }

  img {
    border-radius: 3px;
  }

  p {
    display: block;
  }

  .progress-bar {
    position: relative;
    width: 100%;
    max-width: 360px;
    height: 4px;
    margin: -1px;
    border: 1px solid #e1e4e8;
    border-radius: 4px;
    overflow: hidden;
    padding: 2px;
    z-index: 0;
  }

  #progress {
    position: absolute;
    top: -1px;
    left: 0;
    width: 100%;
    height: 6px;
    transform-origin: left center;
    background-color: #24292e;
    animation: progress calc(var(--duration) * 1ms) linear;
    animation-delay: calc(var(--progress) * -1ms);
  }

  .progress-bar {
    margin-top: 4px;
  }

  #cover {
    box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 3px 10px rgba(0,0,0,0.05);
  }

  #cover:not([src]) {
    box-shadow: none;
  }

  @keyframes progress {
    from {
      transform: scaleX(0)
    }
    to {
      transform: scaleX(1)
    }
  }
`
