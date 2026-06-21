import os from "node:os";
import path from "node:path";
import { ok, err, type Result } from "neverthrow";
import { dateVars } from "./date-vars.js";
import {
  getGitInfo,
  getGitRemoteInfo,
  getRepoRelativePath,
  templateNeedsGit,
  templateNeedsGitRemote,
  templateNeedsRepoRoot,
} from "./git.js";

/** Non-git cwd variables. Shared so `--help`'s live catalog can't drift from
 * the values templates actually receive. */
export function cwdVars(): {
  fullpath: string;
  basename: string;
  parentDir: string;
} {
  const fullpath = process.cwd();
  return {
    fullpath,
    basename: path.basename(fullpath),
    parentDir: path.basename(path.dirname(fullpath)),
  };
}

export async function buildVariables(
  template: string,
  date: Date
): Promise<Result<Record<string, unknown>, string>> {
  const base = cwdVars();
  const fullpath = base.fullpath;

  const cwd: Record<string, unknown> = { ...base };

  const vars: Record<string, unknown> = {
    env: process.env,
    cwd,
    os,
    ...dateVars(date),
  };

  if (templateNeedsRepoRoot(template)) {
    const result = await getRepoRelativePath();
    if (result.isErr()) {
      return err(
        `Error: cwd.fromRepoRoot is used but ${fullpath} is not a git repository`
      );
    }
    cwd.fromRepoRoot = result.value;
  }

  if (templateNeedsGit(template)) {
    const gitResult = await getGitInfo();
    if (gitResult.isErr()) {
      return err(
        `Error: git.* is used but ${fullpath} is not a git repository`
      );
    }
    const git = gitResult.value;

    if (templateNeedsGitRemote(template)) {
      const remoteResult = await getGitRemoteInfo();
      if (remoteResult.isErr()) {
        return err(
          `Error: git.owner/git.repo is used but ${remoteResult.error}`
        );
      }
      git.owner = remoteResult.value.owner;
      git.repo = remoteResult.value.repo;
    }

    vars.git = git;
  }

  return ok(vars);
}
