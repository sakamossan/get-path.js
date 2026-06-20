import { ok, err, type Result } from "neverthrow";
import { $ } from "zx";

export type GitInfo = {
  branch: string;
  commit: { short: string; long: string };
  owner?: string;
  repo?: string;
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

export type GitRemoteInfo = {
  owner: string;
  repo: string;
};

/**
 * Parse owner/repo from a git remote URL.
 * Supports scp-like syntax (git@github.com:owner/repo.git) and
 * URL syntax (https://github.com/owner/repo.git, ssh://git@host/owner/repo).
 * Returns null when the URL cannot be parsed into owner/repo.
 */
export function parseGitRemote(url: string): GitRemoteInfo | null {
  const trimmed = url.trim();

  let pathPart: string | null = null;
  const scp = trimmed.match(/^[^/@]+@[^:]+:(.+)$/);
  if (scp) {
    pathPart = scp[1];
  } else {
    const proto = trimmed.match(
      /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/(?:[^/@]+@)?[^/]+\/(.+)$/
    );
    if (proto) pathPart = proto[1];
  }
  if (!pathPart) return null;

  pathPart = pathPart.replace(/\.git$/, "").replace(/\/+$/, "");
  const segs = pathPart.split("/").filter(Boolean);
  if (segs.length < 2) return null;

  return { owner: segs[0], repo: segs[segs.length - 1] };
}

export async function getGitRemoteInfo(): Promise<
  Result<GitRemoteInfo, string>
> {
  let url: string;
  try {
    url = (
      await $({ quiet: true })`git remote get-url origin`
    ).stdout.trim();
  } catch {
    return err("no git remote 'origin' is configured");
  }
  const parsed = parseGitRemote(url);
  if (!parsed) {
    return err(`could not parse owner/repo from remote URL: ${url}`);
  }
  return ok(parsed);
}

export function templateNeedsGit(template: string): boolean {
  return /\bgit\./.test(template);
}

export function templateNeedsGitRemote(template: string): boolean {
  return /\bgit\.(owner|repo)\b/.test(template);
}
