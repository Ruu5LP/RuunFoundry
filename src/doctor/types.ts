export type Severity = "error" | "warn";
export type CheckStatus = "pass" | "warn" | "fail";

export interface DoctorContext {
  cwd: string;
  /** cwd からの相対パスで存在確認する */
  exists(relPath: string): boolean;
  /** glob 的な簡易マッチ: ディレクトリ内にパターンに合うファイルがあるか */
  existsAny(relPaths: string[]): boolean;
}

export interface DoctorCheck {
  id: string;
  label: string;
  category: string;
  severity: Severity;
  /** 見つからなかったときの修正ガイド */
  hint: string;
  check(ctx: DoctorContext): boolean;
  /**
   * `doctor --fix` 時に、欠けているものを最小構成で自動生成する。
   * check が false(=欠如)のときだけ呼ばれるため既存ファイルは上書きしない。
   * 返り値は実施内容の説明。未定義のチェックは --fix 対象外(hint に沿って手動対応)。
   */
  fix?(ctx: DoctorContext): string;
}

export interface FixReport {
  /** 自動生成できた項目 */
  fixed: { label: string; message: string }[];
  /** fix を持たず手動対応が必要な失敗項目 */
  unfixable: { label: string; hint: string }[];
}

export interface CheckResult {
  id: string;
  label: string;
  category: string;
  status: CheckStatus;
  hint?: string;
}

export interface DoctorReport {
  results: CheckResult[];
  passed: number;
  warned: number;
  failed: number;
  ok: boolean;
}
