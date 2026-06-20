import os from "node:os";
import path from "node:path";
import { ok, err, type Result } from "neverthrow";
import { dateVars } from "./date-vars.js";
import {
  getGitInfo,
  getGitRemoteInfo,
  templateNeedsGit,
  templateNeedsGitRemote,
} from "./git.js";

export async function buildVariables(
  template: string,
  date: Date
): Promise<Result<Record<string, unknown>, string>> {
  const fullpath = process.cwd();

  const vars: Record<string, unknown> = {
    env: process.env,
    cwd: {
      fullpath,
      basename: path.basename(fullpath),
      parentDir: path.basename(path.dirname(fullpath)),
    },
    os,
    ...dateVars(date),
  };

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
