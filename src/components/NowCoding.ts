import { html } from 'htm/preact';
import ReadmeImg from "./ReadmeImg.ts";
import Text from "./Text.ts";

export interface Props {
  isCoding: boolean;
  fileName: string;
  language: string;
  repoName?: string;
  iconUrl: string;
  gitUrl?: string;
}

export const NowCoding = ({ isCoding, fileName, language, repoName, iconUrl, gitUrl }: Props) => {

  const inner = html`
    <img src="${iconUrl}" width="48" height="48" style=${{ borderRadius: 3, marginLeft: 16 }} />
    <div
      style=${{
      display: "flex",
      flex: 1,
      flexDirection: "column",
      marginTop: -4,
      marginLeft: 16,
    }}
    >
      <${Text} weight="bold">
        ${isCoding ? `Editing ${fileName}` : "Not currently coding"}
      </${Text}>
      <${Text} color="${!isCoding ? "gray" : undefined}">
        ${isCoding ? `VS Code • ${language} ${repoName ? `• ${repoName} Workspace` : ""}` : "Visual Studio Code"}
      </${Text}>
    </div>
  `;

  return html`
    <${ReadmeImg} width="540" height="64">
      <div
        style=${{
      display: "flex",
      alignItems: "center",
      paddingTop: 8,
      paddingLeft: 4,
    }}
      >
        ${gitUrl && gitUrl !== ""
      ? html`<a href="${gitUrl}" target="_blank" style=${{ textDecoration: "none", display: "flex", flex: 1, alignItems: "center" }}>${inner}</a>`
      : inner}
      </div>
    </${ReadmeImg}>
  `;
};
