# プラグイン開発ガイド

FoundRuu はプラグインで **コマンド** と **doctor チェック** を拡張できます。
このガイドは自作プラグインの作り方・ローカル開発・npm 公開までを扱います。

実装は [src/core/plugins.ts](../src/core/plugins.ts)、公式サンプルは
[plugins/foundruu-plugin-security](../plugins/foundruu-plugin-security/) を参照してください。

## プラグインとは

`name` と `register(ctx)` を持つオブジェクトをエクスポートする Node モジュールです。
CommonJS(`module.exports = ...`)でも ES Module の default export でも構いません。

```js
// 最小のプラグイン
module.exports = {
  name: "my-plugin",
  register(ctx) {
    // ここでコマンド追加 / doctor チェック追加を行う
  },
};
```

`register` は FoundRuu の起動時に一度だけ呼ばれます。

## 読み込まれる仕組み(2 通り)

プラグインは実行対象リポジトリの `cwd` を基準に、次の順で自動探索されます。
**設定不要**（1）か、**明示指定**（2）のどちらでも動きます。

1. **`node_modules` の命名規約** — `foundruu-plugin-*` または
   `@scope/foundruu-plugin-*` という名前のパッケージ。インストールするだけで読み込まれます。
2. **`foundruu.json` の `plugins` 配列** — モジュール名、または相対パス(`./` / 絶対パス)。
   ローカル開発や、規約名にしたくないパッケージ向け。

```json
// foundruu.json
{
  "version": "0.7.1",
  "plugins": ["./scripts/my-local-plugin.js", "some-internal-package"]
}
```

壊れたプラグイン(読み込み例外、`name`/`register` 不足)は **警告を出してスキップ**され、
CLI 全体は落ちません([loadPlugins](../src/core/plugins.ts) の挙動)。

## `register(ctx)` で使えるもち道具(PluginContext)

| プロパティ              | 型                     | 用途                                          |
| ----------------------- | ---------------------- | --------------------------------------------- |
| `program`               | commander の `Command` | サブコマンドを追加する                        |
| `addDoctorCheck(check)` | 関数                   | `foundruu doctor` にチェックを 1 件追加する   |
| `log`                   | logger                 | `log.info/step/success/warn/error` で出力する |

### doctor チェックを追加する

`addDoctorCheck` に渡す `DoctorCheck` の形([src/doctor/types.ts](../src/doctor/types.ts)):

| フィールド   | 説明                                                    |
| ------------ | ------------------------------------------------------- |
| `id`         | 一意の識別子(例 `security-md`)                          |
| `label`      | 一覧に出る表示名                                        |
| `category`   | グルーピング用のカテゴリ名                              |
| `severity`   | `"error"` → 失敗時 fail(exit 1)/ `"warn"` → 失敗時 warn |
| `hint`       | 見つからなかったときの修正ガイド                        |
| `check(ctx)` | `true` で pass。`ctx` は下記 `DoctorContext`            |

`DoctorContext` は判定を書きやすくするヘルパを持ちます:

- `ctx.cwd` — 診断対象ディレクトリの絶対パス
- `ctx.exists(relPath)` — 相対パスの存在確認
- `ctx.existsAny(relPaths)` — いずれかが存在すれば `true`

```js
module.exports = {
  name: "security",
  register({ addDoctorCheck }) {
    addDoctorCheck({
      id: "security-md",
      label: "SECURITY.md",
      category: "セキュリティ",
      severity: "warn",
      hint: "SECURITY.md で脆弱性の報告窓口を明記してください",
      check: (ctx) => ctx.existsAny(["SECURITY.md", ".github/SECURITY.md"]),
    });
  },
};
```

より複雑な判定は `ctx.cwd` を起点に自分で `fs` を読んでも構いません
(公式サンプルの `.env` gitignore チェックが例)。

### コマンドを追加する

`program` は commander の `Command` そのものです。

```js
module.exports = {
  name: "audit",
  register({ program, log }) {
    program
      .command("audit")
      .description("依存の簡易監査を実行する")
      .action(() => log.success("audit 完了"));
  },
};
```

追加したコマンドは `foundruu audit` として、`foundruu --help` にも表示されます。

## ローカルで開発する

1. プラグインを 1 ファイル(例 `scripts/my-plugin.js`)で書く
2. 対象リポジトリの `foundruu.json` に相対パスを登録

   ```json
   { "plugins": ["./scripts/my-plugin.js"] }
   ```

3. `foundruu plugins` で読み込まれているか確認 → `foundruu doctor` などで動作確認

`foundruu plugins` は読み込み済みプラグインの名前と読み込み元を一覧表示します。

## npm パッケージとして公開する

公式サンプルの
[package.json](../plugins/foundruu-plugin-security/package.json) をひな形にしてください。要点:

- **`name`** は `foundruu-plugin-<something>`(規約名にすると利用側は設定不要になる)
- **`main`** をエントリ(`index.js`)に
- **`files`** に公開物(`index.js` など)を列挙
- **`keywords`** に `foundruu` / `foundruu-plugin` を入れて検索性を上げる
- **`peerDependencies`** に `"foundruu": ">=0.7.0"` を入れ、対応バージョンを明示

```bash
npm publish --access public
```

公開後、利用者は次だけで導入できます:

```bash
npm install -D foundruu-plugin-<something>
# node_modules に入れば自動で読み込まれる(設定不要)
```

## チェックリスト

- [ ] `name` と `register(ctx)` をエクスポートしている
- [ ] `addDoctorCheck` の `id` が他と衝突しない一意な値
- [ ] `severity` を適切に選んでいる(CI を落としたいものだけ `error`)
- [ ] `foundruu plugins` で読み込みを確認した
- [ ] 公開する場合、`name` が `foundruu-plugin-*` で `peerDependencies` を明記した
