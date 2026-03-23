import { ok, err, type Result } from "neverthrow";
import { $ } from "zx";

export type GitInfo = {
  branch: string;
  commit: { short: string; long: string };
};

export async function getGitInfo(): Promise<Result<GitInfo, string>> {
  try {
    const branch = (
      await $({ quiet: true })`git rev-parse --abbrev-ref HEAD`
    ).stdout.trim();
    const long = (
      await $({ quiet: true })`git rev-parse HEAD`
    ).stdout.trim();
    const short = (
      await $({ quiet: true })`git rev-parse --short HEAD`
    ).stdout.trim();
    return ok({ branch, commit: { short, long } });
  } catch {
    return err("Not a git repository (or git command failed)");
  }
}

export function templateNeedsGit(template: string): boolean {
  return /\bgit\./.test(template);
}
