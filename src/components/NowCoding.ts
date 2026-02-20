import { html } from 'htm/preact';
import ReadmeImg from "./ReadmeImg.ts";
import Text from "./Text.ts";

export interface Props {
    isCoding: boolean;
    fileName: string;
    language: string;
}

export const NowCoding = ({ isCoding, fileName, language }: Props) => {
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
        <img src="https://skillicons.dev/icons?i=vscode" width="48" height="48" style=${{ borderRadius: 3, marginLeft: 16 }} />
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
            ${isCoding ? `VS Code • ${language}` : "Visual Studio Code"}
          </${Text}>
        </div>
      </div>
    </${ReadmeImg}>
  `;
};
