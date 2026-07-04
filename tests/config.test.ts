/**
 * config.ts のテスト。
 *
 * foundruu.json の読み書きは init / workflow / update 各コマンドの土台で、
 * ここが壊れると「導入済みか」「どのファイルをユーザーが編集したか」の判定が
 * すべて狂う。そのため以下を検証する:
 *   - 設定ファイルが無いときは null(=未導入)を返す
 *   - write → read がラウンドトリップし、ネストした workflow.files も保持される
 *   - configPath が cwd 基準で CONFIG_FILE を指す
 *   - cliVersion が package.json の version を読めている
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  CONFIG_FILE,
  configPath,
  readConfig,
  writeConfig,
  cliVersion,
  FoundruuConfig,
} from "../src/core/config";

let cwd: string;

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), "foundruu-config-"));
});
afterEach(() => {
  fs.rmSync(cwd, { recursive: true, force: true });
});

describe("readConfig", () => {
  it("設定ファイルが無ければ null(未導入)を返す", () => {
    expect(readConfig(cwd)).toBeNull();
  });

  it("writeConfig で書いた内容をそのまま読み戻せる", () => {
    const config: FoundruuConfig = {
      version: "0.7.0",
      template: "typescript",
      projectName: "my-app",
      installedAt: "2026-07-04T00:00:00.000Z",
    };
    writeConfig(cwd, config);
    expect(readConfig(cwd)).toEqual(config);
  });

  it("ネストした workflow.files(相対パス→ハッシュ)も保持される", () => {
    const config: FoundruuConfig = {
      version: "0.7.0",
      workflow: {
        version: "1.0.0",
        installedAt: "2026-07-04T00:00:00.000Z",
        files: { ".ai/workflows/feature.md": "abc123" },
      },
    };
    writeConfig(cwd, config);
    expect(readConfig(cwd)?.workflow?.files?.[".ai/workflows/feature.md"]).toBe("abc123");
  });
});

describe("writeConfig", () => {
  it("整形済み JSON を末尾改行付きで CONFIG_FILE に書き出す", () => {
    writeConfig(cwd, { version: "0.7.0" });
    const raw = fs.readFileSync(path.join(cwd, CONFIG_FILE), "utf8");
    expect(raw.endsWith("\n")).toBe(true);
    expect(raw).toContain('  "version": "0.7.0"'); // 2 スペースインデント
  });
});

describe("configPath", () => {
  it("cwd 直下の foundruu.json を指す", () => {
    expect(configPath("/some/dir")).toBe(path.join("/some/dir", CONFIG_FILE));
  });
});

describe("cliVersion", () => {
  it("package.json の version(semver 形式)を返す", () => {
    expect(cliVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
