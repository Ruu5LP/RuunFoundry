import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { addRule } from "../src/commands/rules";

let tmp: string;

const rulesFile = () => path.join(tmp, ".ai", "rules", "review-feedback.md");

beforeEach(() => {
  tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "foundruu-rules-")));
  fs.mkdirSync(path.join(tmp, ".ai"), { recursive: true });
});
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("addRule", () => {
  it("初回はヘッダー付きでルールファイルを作成する", () => {
    addRule(tmp, "named constructor を乱用しない");
    const content = fs.readFileSync(rulesFile(), "utf8");
    expect(content).toContain("# レビュー指摘から昇格した規約");
    expect(content).toContain("- named constructor を乱用しない");
  });

  it("2回目以降は追記され、ヘッダーは重複しない", () => {
    addRule(tmp, "ルール1");
    addRule(tmp, "ルール2");
    const content = fs.readFileSync(rulesFile(), "utf8");
    expect(content.match(/# レビュー指摘から昇格した規約/g)).toHaveLength(1);
    expect(content).toContain("- ルール1");
    expect(content).toContain("- ルール2");
  });

  it("--file で追記先を変えられる(.md は自動補完)", () => {
    addRule(tmp, "設計規約", { file: "class-design" });
    expect(fs.existsSync(path.join(tmp, ".ai", "rules", "class-design.md"))).toBe(true);
  });

  it("空文字はエラー", () => {
    expect(() => addRule(tmp, "  ")).toThrow(/内容を指定/);
  });

  it("ファイル名にパス区切りは使えない", () => {
    expect(() => addRule(tmp, "x", { file: "../evil" })).toThrow(/パス区切り/);
  });

  it(".ai が無いリポジトリではエラー", () => {
    const bare = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "foundruu-noai-")));
    try {
      expect(() => addRule(bare, "x")).toThrow(/\.ai ディレクトリが見つかりません/);
    } finally {
      fs.rmSync(bare, { recursive: true, force: true });
    }
  });
});
