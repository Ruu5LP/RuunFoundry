import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { staleSourceCommits, unpromotedDesigns } from "../src/doctor/maintenance";

let tmp: string;

const write = (rel: string, content: string) => {
  const full = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
};

const git = (...args: string[]) => execFileSync("git", ["-C", tmp, ...args], { stdio: "pipe" });

const commit = (message: string) => {
  git("add", "-A");
  git(
    "-c",
    "user.email=test@example.com",
    "-c",
    "user.name=test",
    "commit",
    "-q",
    "-m",
    message,
    "--no-verify"
  );
};

beforeEach(() => {
  tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "foundruu-maintenance-")));
  git("init", "-q", "-b", "main");
});
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("staleSourceCommits", () => {
  it("docs 更新後のソース変更コミット数を数える", () => {
    write("docs/architecture.md", "# 設計");
    write("src/a.ts", "export {};");
    commit("初期コミット");
    write("src/a.ts", "export const a = 1;");
    commit("ソース変更1");
    write("src/b.ts", "export {};");
    commit("ソース変更2");
    expect(staleSourceCommits(tmp, ["docs"], ["src"])).toBe(2);
  });

  it("docs を更新するとカウントがリセットされる", () => {
    write("docs/architecture.md", "# 設計");
    write("src/a.ts", "export {};");
    commit("初期コミット");
    write("src/a.ts", "export const a = 1;");
    commit("ソース変更");
    write("docs/architecture.md", "# 設計 v2");
    commit("docs 更新");
    expect(staleSourceCommits(tmp, ["docs"], ["src"])).toBe(0);
  });

  it("docs や src が無ければ計測不能(null)", () => {
    write("src/a.ts", "export {};");
    commit("src のみ");
    expect(staleSourceCommits(tmp, ["docs"], ["src"])).toBeNull();
  });

  it("git 管理外では null", () => {
    const bare = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "foundruu-nogit-")));
    try {
      fs.mkdirSync(path.join(bare, "docs"));
      fs.mkdirSync(path.join(bare, "src"));
      expect(staleSourceCommits(bare, ["docs"], ["src"])).toBeNull();
    } finally {
      fs.rmSync(bare, { recursive: true, force: true });
    }
  });
});

describe("unpromotedDesigns", () => {
  const endSession = (name: string, endedAt: string) => {
    write(`.ai/sessions/.status/${name}.json`, JSON.stringify({ startedAt: endedAt, endedAt }));
  };

  it("終了後に docs/architecture.md が未更新なら昇格漏れ候補になる", () => {
    write("docs/architecture.md", "# 設計");
    commit("docs コミット");
    write(".ai/sessions/s1/design.md", "# 恒久的な設計判断");
    endSession("s1", new Date(Date.now() + 60_000).toISOString());
    expect(unpromotedDesigns(tmp)).toEqual(["s1"]);
  });

  it("終了後に docs/architecture.md が更新されていれば対象外", () => {
    write(".ai/sessions/s1/design.md", "# 設計判断");
    endSession("s1", "2020-01-01T00:00:00.000Z");
    write("docs/architecture.md", "# 設計(昇格済み)");
    commit("docs 更新");
    expect(unpromotedDesigns(tmp)).toEqual([]);
  });

  it("design.md が空・進行中セッションは対象外", () => {
    write("docs/architecture.md", "# 設計");
    commit("docs コミット");
    write(".ai/sessions/empty/design.md", "  \n");
    endSession("empty", new Date(Date.now() + 60_000).toISOString());
    write(".ai/sessions/running/design.md", "# 設計");
    write(
      ".ai/sessions/.status/running.json",
      JSON.stringify({ startedAt: new Date().toISOString() })
    );
    expect(unpromotedDesigns(tmp)).toEqual([]);
  });
});
