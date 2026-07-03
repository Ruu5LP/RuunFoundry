const fs = require("fs");
const path = require("path");

/**
 * FoundRuu 公式プラグインサンプル。
 * doctor にセキュリティ観点のチェックを3つ追加する。
 * プラグインの書き方の参考実装でもある(https://github.com/Ruu5LP/foundruu#プラグイン)。
 */
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
    addDoctorCheck({
      id: "security-env-ignored",
      label: ".env が gitignore されている",
      category: "セキュリティ",
      severity: "error",
      hint: ".gitignore に .env を追加し、秘密情報のコミットを防いでください",
      check: (ctx) => {
        const gitignore = path.join(ctx.cwd, ".gitignore");
        if (!fs.existsSync(gitignore)) return false;
        return fs
          .readFileSync(gitignore, "utf8")
          .split(/\r?\n/)
          .some((line) => /^\.env(\..*)?$|^\*\.env$/.test(line.trim()));
      },
    });
    addDoctorCheck({
      id: "security-deps-automation",
      label: "依存更新の自動化 (Dependabot / Renovate)",
      category: "セキュリティ",
      severity: "warn",
      hint: ".github/dependabot.yml または renovate.json を追加してください",
      check: (ctx) =>
        ctx.existsAny([".github/dependabot.yml", ".github/dependabot.yaml", "renovate.json", ".renovaterc.json"]),
    });
  },
};
