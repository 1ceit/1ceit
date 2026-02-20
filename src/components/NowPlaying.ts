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
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
          style=${{ width: "16px", marginRight: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ${track
      ? (isPlaying
        ? html`<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`
        : html`<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`)
      : ""}
        </${Text}>
        ${!track ? html`<svg width="48" height="48" viewBox="0 0 24 24" fill="#1DB954" style=${{ borderRadius: 3, background: "#191414" }} xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>` :
      html`<img id="cover" src="${cover ?? undefined}" width="48" height="48" />`}
        <div
          style=${{
      display: "flex",
      flex: 1,
      flexDirection: "column",
      marginTop: -4,
      marginLeft: 8,
    }}
        >
          <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style=${{ display: "flex", flexDirection: "column" }}>
              <${Text} id="track" weight="bold">
                ${track ? track : 'Not playing anything'}
              </${Text}>
              <${Text} id="artist" color="${!track ? "gray" : undefined}">
                ${track ? artist : 'Spotify'}
              </${Text}>
            </div>
            ${track && progress != null && duration ? html`
              <${Text} color="gray" size="small" style=${{ fontSize: "12px", marginBottom: "2px", marginRight: "16px" }}>
                ${formatTime(progress)} / ${formatTime(duration)}
              </${Text}>
            ` : ''}
          </div>
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
    border: 1px solid #e1e5e9ff;
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
    background-color: #bbbdbeff;
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
