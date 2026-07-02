import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { applyRc, readRc } from "../src/doctor/rc";
import { checks } from "../src/doctor/checks";
import { runDoctor } from "../src/doctor/runner";

let tmp: string;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "foundruu-rc-"));
});
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe(".foundruurc", () => {
  it("disable でチェックを無効化できる", () => {
    const rc = { doctor: { disable: ["license", "docker"] } };
    const applied = applyRc(checks, rc);
    expect(applied.find((c) => c.id === "license")).toBeUndefined();
    expect(applied.find((c) => c.id === "docker")).toBeUndefined();
    expect(applied.length).toBe(checks.length - 2);
  });

  it("severity を上書きできる", () => {
    const rc = { doctor: { severity: { license: "error" as const } } };
    const applied = applyRc(checks, rc);
    expect(applied.find((c) => c.id === "license")?.severity).toBe("error");
    // 元の定義は変更しない
    expect(checks.find((c) => c.id === "license")?.severity).toBe("warn");
  });

  it("runDoctor が .foundruurc を反映する", () => {
    fs.writeFileSync(
      path.join(tmp, ".foundruurc"),
      JSON.stringify({ doctor: { disable: ["readme"], severity: { license: "error" } } })
    );
    const report = runDoctor(tmp);
    expect(report.results.find((r) => r.id === "readme")).toBeUndefined();
    expect(report.results.find((r) => r.id === "license")?.status).toBe("fail");
  });

  it("不正な JSON はエラーになる", () => {
    fs.writeFileSync(path.join(tmp, ".foundruurc"), "{oops");
    expect(() => readRc(tmp)).toThrow(/JSON が不正/);
  });
});
