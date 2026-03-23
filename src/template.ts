import { ok, err, type Result } from "neverthrow";

export function evaluateTemplate(
  template: string,
  vars: Record<string, unknown>
): Result<string, string> {
  const keys = Object.keys(vars);
  const values = Object.values(vars);
  try {
    const fn = new Function(...keys, `return \`${template}\``);
    const result = fn(...values);
    return ok(String(result));
  } catch (e) {
    return err(`Template evaluation failed: ${e}`);
  }
}
