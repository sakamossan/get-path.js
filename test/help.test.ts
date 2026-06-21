import os from "node:os";
import { describe, test, expect, afterEach } from "vitest";
import { cd } from "zx";
import { renderHelp } from "../src/help";

// These tests assume they run from inside this git repository at the repo root
// with an `origin` remote configured (the normal `npm test` working directory).
describe("renderHelp (inside git repo, at repo root)", () => {
  test("includes the static USAGE and the catalog header", async () => {
    const out = await renderHelp();
    expect(out).toContain("Usage: get-path");
    expect(out).toContain("Template Variables (resolved for the current context)");
  });

  test("① date variables resolve to quoted values", async () => {
    const out = await renderHelp();
    expect(out).toContain("${YYYY}");
    expect(out).toMatch(/\$\{YYYY\}\s+= "/);
  });

  test("② fromRepoRoot is empty with a note at repo root", async () => {
    const out = await renderHelp();
    expect(out).toMatch(/\$\{cwd\.fromRepoRoot\}\s+= ""/);
    expect(out).toContain("empty at repo root");
  });

  test("① git.owner resolves from origin", async () => {
    const out = await renderHelp();
    expect(out).toMatch(/\$\{git\.owner\}\s+= "sakamossan"/);
  });

  test("④ env.HOME shown as an example", async () => {
    const out = await renderHelp();
    expect(out).toMatch(/\$\{env\.HOME\}\s+e\.g\. "/);
  });
});

describe("renderHelp (outside a git repo)", () => {
  // zx's `$` tracks its own cwd, so use zx's `cd()` (updates both process.cwd
  // and $.cwd) rather than bare process.chdir, or git would still resolve here.
  const original = process.cwd();
  afterEach(() => cd(original));

  test("③ git variables degrade to ✗ while date/cwd still resolve", async () => {
    cd(os.tmpdir());
    const out = await renderHelp();
    expect(out).toMatch(/\$\{git\.branch\}\s+✗ /);
    expect(out).toMatch(/\$\{git\.owner\}\s+✗ /);
    // non-git parts remain available
    expect(out).toMatch(/\$\{YYYY\}\s+= "/);
    expect(out).toMatch(/\$\{cwd\.fullpath\}\s+= "/);
  });
});
