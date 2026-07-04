/**
 * fetcher.ts のテスト。
 *
 * fetchWorkflowAssets は「GitHub 上の最新アセットを取りに行き、失敗したら
 * CLI 同梱アセットへフォールバックする」というオフライン耐性の要。
 * ネットワーク/実 git を叩かずに分岐を検証するため、child_process.execFileSync を
 * モックし、os.homedir をテンポラリへ差し替えてキャッシュ位置を制御する。
 * 検証する分岐:
 *   - local:true      … git を一切呼ばず同梱アセットを返す
 *   - 初回 clone 成功  … remote を返す
 *   - 既存キャッシュ   … fetch + reset を通り remote を返す
 *   - git が失敗       … 同梱アセットへフォールバック(source: bundled)
 *   - clone は成功だが assets/workflow が無い … 同じくフォールバック
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { fetchWorkflowAssets } from "../src/core/fetcher";

vi.mock("child_process", () => ({ execFileSync: vi.fn() }));

const gitMock = vi.mocked(execFileSync);

let home: string;
let cache: string;

beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), "foundruu-home-"));
  cache = path.join(home, ".foundruu", "cache", "foundruu");
  vi.spyOn(os, "homedir").mockReturnValue(home);
  gitMock.mockReset();
});
afterEach(() => {
  fs.rmSync(home, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("fetchWorkflowAssets", () => {
  it("local:true では git を呼ばず同梱アセットを返す", () => {
    const result = fetchWorkflowAssets({ local: true });
    expect(gitMock).not.toHaveBeenCalled();
    expect(result.source).toBe("bundled");
    expect(result.root).toContain(path.join("assets", "workflow"));
  });

  it("キャッシュが無ければ clone し、成功すれば remote を返す", () => {
    // clone コマンドを検知して、実際に取得できたかのようにディレクトリを用意する
    gitMock.mockImplementation((_cmd, args) => {
      if (Array.isArray(args) && args[0] === "clone") {
        fs.mkdirSync(path.join(cache, "assets", "workflow"), { recursive: true });
        fs.mkdirSync(path.join(cache, ".git"), { recursive: true });
      }
      return Buffer.from("");
    });

    const result = fetchWorkflowAssets();
    expect(gitMock).toHaveBeenCalledOnce();
    expect(result.source).toBe("remote");
    expect(result.root).toBe(path.join(cache, "assets", "workflow"));
  });

  it("既存キャッシュ(.git あり)では fetch + reset を通って remote を返す", () => {
    fs.mkdirSync(path.join(cache, ".git"), { recursive: true });
    fs.mkdirSync(path.join(cache, "assets", "workflow"), { recursive: true });
    gitMock.mockReturnValue(Buffer.from(""));

    const result = fetchWorkflowAssets();
    // fetch と reset の 2 回呼ばれる(clone ではない)
    expect(gitMock).toHaveBeenCalledTimes(2);
    expect(gitMock.mock.calls[0][1]).toContain("fetch");
    expect(gitMock.mock.calls[1][1]).toContain("reset");
    expect(result.source).toBe("remote");
  });

  it("git が失敗したら同梱アセットへフォールバックする(オフライン想定)", () => {
    gitMock.mockImplementation(() => {
      throw new Error("network unreachable");
    });

    const result = fetchWorkflowAssets();
    expect(result.source).toBe("bundled");
    expect(result.root).toContain(path.join("assets", "workflow"));
  });

  it("clone は成功しても assets/workflow が無ければフォールバックする", () => {
    // .git だけ作って assets/workflow は作らない
    gitMock.mockImplementation((_cmd, args) => {
      if (Array.isArray(args) && args[0] === "clone") {
        fs.mkdirSync(path.join(cache, ".git"), { recursive: true });
      }
      return Buffer.from("");
    });

    const result = fetchWorkflowAssets();
    expect(result.source).toBe("bundled");
  });
});
