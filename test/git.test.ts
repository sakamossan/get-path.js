import { describe, test, expect } from "vitest";
import {
  parseGitRemote,
  templateNeedsGit,
  templateNeedsGitRemote,
  templateNeedsRepoRoot,
} from "../src/git";

describe("parseGitRemote", () => {
  test("scp-like SSH syntax", () => {
    expect(parseGitRemote("git@github.com:sakamossan/get-path.js.git")).toEqual(
      { owner: "sakamossan", repo: "get-path.js" }
    );
  });

  test("scp-like SSH syntax without .git suffix", () => {
    expect(parseGitRemote("git@github.com:sakamossan/get-path.js")).toEqual({
      owner: "sakamossan",
      repo: "get-path.js",
    });
  });

  test("HTTPS syntax", () => {
    expect(
      parseGitRemote("https://github.com/sakamossan/get-path.js.git")
    ).toEqual({ owner: "sakamossan", repo: "get-path.js" });
  });

  test("HTTPS syntax without .git suffix", () => {
    expect(parseGitRemote("https://github.com/sakamossan/get-path.js")).toEqual(
      { owner: "sakamossan", repo: "get-path.js" }
    );
  });

  test("ssh:// URL syntax", () => {
    expect(
      parseGitRemote("ssh://git@github.com/sakamossan/get-path.js.git")
    ).toEqual({ owner: "sakamossan", repo: "get-path.js" });
  });

  test("HTTPS with credentials", () => {
    expect(
      parseGitRemote("https://user@github.com/sakamossan/get-path.js.git")
    ).toEqual({ owner: "sakamossan", repo: "get-path.js" });
  });

  test("trailing slash", () => {
    expect(parseGitRemote("https://github.com/sakamossan/get-path.js/")).toEqual(
      { owner: "sakamossan", repo: "get-path.js" }
    );
  });

  test("GitLab subgroup uses first segment as owner, last as repo", () => {
    expect(
      parseGitRemote("git@gitlab.com:group/subgroup/repo.git")
    ).toEqual({ owner: "group", repo: "repo" });
  });

  test("returns null for unparseable URL", () => {
    expect(parseGitRemote("not-a-url")).toBeNull();
    expect(parseGitRemote("https://github.com/onlyowner")).toBeNull();
  });
});

describe("templateNeedsGit", () => {
  test("detects git.*", () => {
    expect(templateNeedsGit("${git.branch}/x")).toBe(true);
    expect(templateNeedsGit("${git.owner}/x")).toBe(true);
    expect(templateNeedsGit("${cwd.basename}")).toBe(false);
  });
});

describe("templateNeedsGitRemote", () => {
  test("detects git.owner / git.repo only", () => {
    expect(templateNeedsGitRemote("${git.owner}/x")).toBe(true);
    expect(templateNeedsGitRemote("${git.repo}/x")).toBe(true);
    expect(templateNeedsGitRemote("${git.branch}/x")).toBe(false);
    expect(templateNeedsGitRemote("${git.commit.short}")).toBe(false);
  });
});

describe("templateNeedsRepoRoot", () => {
  test("detects cwd.fromRepoRoot only", () => {
    expect(templateNeedsRepoRoot("${cwd.fromRepoRoot}/x")).toBe(true);
    expect(templateNeedsRepoRoot("${cwd.basename}")).toBe(false);
    expect(templateNeedsRepoRoot("${git.branch}")).toBe(false);
  });
});
