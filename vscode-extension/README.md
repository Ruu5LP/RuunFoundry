# FoundRuu VSCode Extension

FoundRuu CLI をコマンドパレットから呼び出す最小構成の拡張です。

## コマンド（⇧⌘P）

- **FoundRuu: Doctor（健全性診断）** — `foundruu doctor`
- **FoundRuu: Doctor Deep（品質スコア診断）** — `foundruu doctor --deep`
- **FoundRuu: セッションを作成** — 名前を入力して `foundruu session start <name>`
- **FoundRuu: Workflow を導入** — `foundruu workflow install`
- **FoundRuu: Workflow を更新** — `foundruu update --diff`

いずれも統合ターミナル(`FoundRuu`)で `npx foundruu` を実行します。CLI のインストールは不要です（npx が解決します）。

## 手元でのインストール

```bash
cd vscode-extension
npx @vscode/vsce package        # foundruu-vscode-0.1.0.vsix を生成
code --install-extension foundruu-vscode-0.1.0.vsix
```

Marketplace 公開には [publisher アカウント](https://marketplace.visualstudio.com/manage)と PAT が必要です:

```bash
npx @vscode/vsce publish
```
