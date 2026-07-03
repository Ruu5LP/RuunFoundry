# foundruu-plugin-security

[FoundRuu](https://github.com/Ruu5LP/foundruu) の公式プラグインサンプルです。
`foundruu doctor` にセキュリティ観点のチェックを追加します。

## インストール

```bash
npm install -D foundruu-plugin-security
```

プロジェクトの `node_modules` に入っていれば自動で読み込まれます（設定不要）。

## 追加されるチェック

| チェック | severity | 内容 |
|---|---|---|
| SECURITY.md | warn | 脆弱性報告窓口の明記 |
| .env が gitignore されている | error | 秘密情報のコミット防止 |
| 依存更新の自動化 | warn | Dependabot / Renovate の設定 |

## プラグインを自作する

このパッケージの [index.js](index.js) が参考実装です。`foundruu-plugin-*` という名前で
`register({ program, addDoctorCheck, log })` をエクスポートするだけで動きます。
