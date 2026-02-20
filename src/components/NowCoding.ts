import { html } from 'htm/preact';
import ReadmeImg from "./ReadmeImg.ts";
import Text from "./Text.ts";

export interface Props {
  isCoding: boolean;
  fileName: string;
  language: string;
}

export const NowCoding = ({ isCoding, fileName, language }: Props) => {
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
  const iconUrl = `https://raw.githubusercontent.com/iCrawl/discord-vscode/master/assets/icons/${iconId}.png`;

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
            ${isCoding ? `VS Code • ${language}` : "Visual Studio Code"}
          </${Text}>
        </div>
      </div>
    </${ReadmeImg}>
  `;
};
