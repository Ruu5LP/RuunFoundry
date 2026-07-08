import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { renderOnboarding } from "../src/commands/onboard";

let tmp: string;

const write = (rel: string, content: string) => {
  const full = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
};

beforeEach(() => {
  tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "foundruu-onboard-")));
});
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("renderOnboarding", () => {
  it("プロジェクト名・ルール・ワークフロー・セッション・doctor 結果を含む", () => {
    write("package.json", JSON.stringify({ name: "my-app", description: "テストアプリ" }));
    write("CLAUDE.md", "# ルール");
    write(".ai/rules/review-feedback.md", "# 規約");
    write(".ai/workflows/feature.md", "# 手順");
    write(".ai/prompts/session-workflow.md", "# フロー");
    write(".ai/sessions/.current", "feat-x\n");
    fs.mkdirSync(path.join(tmp, ".ai/sessions/feat-x"), { recursive: true });
    write(".ai/sessions/.status/feat-x.json", JSON.stringify({ startedAt: "2026-01-01" }));

    const md = renderOnboarding(tmp);
    expect(md).toContain("# my-app オンボーディング");
    expect(md).toContain("テストアプリ");
    expect(md).toContain("- CLAUDE.md");
    expect(md).toContain("- .ai/rules/review-feedback.md");
    expect(md).toContain(".ai/workflows/feature.md");
    expect(md).toContain(".ai/prompts/session-workflow.md");
    expect(md).toContain("- feat-x: 進行中（現在のセッション）");
    expect(md).toContain("## リポジトリの健全性 (doctor)");
  });

  it("何も無いリポジトリでも導入ガイド付きで生成される", () => {
    const md = renderOnboarding(tmp);
    expect(md).toContain(`# ${path.basename(tmp)} オンボーディング`);
    expect(md).toContain("AI ルールが見つかりません");
    expect(md).toContain("セッションはまだありません");
    expect(md).toContain("fail");
  });

  it("doctor の fail / warn 項目は hint 付きで列挙される", () => {
    const md = renderOnboarding(tmp);
    expect(md).toMatch(/✖ README: /);
  });
});
