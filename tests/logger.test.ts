/**
 * logger.ts のテスト。
 *
 * logger は全コマンドの出力窓口。特に重要なのが useStderr():
 * MCP(stdio)モードでは stdout を JSON-RPC プロトコルが占有するため、
 * ログが 1 行でも stdout に混ざるとプロトコルが壊れる。
 * そのため以下を検証する:
 *   - info/step/success/warn は通常 stdout(console.log)へ出る
 *   - error は常に stderr(console.error)へ出る
 *   - useStderr() 呼び出し後は info 系も stderr へ切り替わる(stdout を汚さない)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// logger はモジュール内に out の状態(useStderr で切り替わる)を持つため、
// テストごとに状態をリセットして読み込み直す。
let log: typeof import("../src/core/logger").log;

let stdout: ReturnType<typeof vi.spyOn>;
let stderr: ReturnType<typeof vi.spyOn>;

beforeEach(async () => {
  vi.resetModules();
  stdout = vi.spyOn(console, "log").mockImplementation(() => {});
  stderr = vi.spyOn(console, "error").mockImplementation(() => {});
  ({ log } = await import("../src/core/logger"));
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("log(通常モード)", () => {
  it("info / step / success / warn は stdout へ出る", () => {
    log.info("i");
    log.step("s");
    log.success("ok");
    log.warn("w");
    expect(stdout).toHaveBeenCalledTimes(4);
    expect(stderr).not.toHaveBeenCalled();
  });

  it("error は常に stderr へ出る", () => {
    log.error("boom");
    expect(stderr).toHaveBeenCalledTimes(1);
    expect(stdout).not.toHaveBeenCalled();
  });
});

describe("useStderr(MCP モード)", () => {
  it("呼び出し後は info 系も stderr へ切り替わり stdout を汚さない", () => {
    log.useStderr();
    log.info("i");
    log.success("ok");
    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).toHaveBeenCalledTimes(2);
  });
});
