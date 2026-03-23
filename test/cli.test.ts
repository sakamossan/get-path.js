import { describe, test, expect } from "vitest";
import { run } from "../src/cli";

describe("cli run", () => {
  test("get subcommand (implicit) evaluates template", async () => {
    const result = await run({
      _: ["hello-${YYYY}"],
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatch(/^hello-\d{4}$/);
  });

  test("get subcommand (explicit) evaluates template", async () => {
    const result = await run({
      _: ["get", "hello-${YYYY}"],
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatch(/^hello-\d{4}$/);
  });

  test("returns error when template is missing", async () => {
    const result = await run({ _: [] });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toContain("template is required");
  });

  test("cwd variables work", async () => {
    const result = await run({
      _: ["${cwd.basename}"],
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe("get-path.js");
  });

  test("env variables work", async () => {
    const result = await run({
      _: ["${env.HOME}"],
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBeTruthy();
  });

  test("git variables work in git repo", async () => {
    const result = await run({
      _: ["${git.branch}"],
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBeTruthy();
  });

  test("list with --until only returns error", async () => {
    const result = await run({
      _: ["list", "${YYYY}${MM}${DD}"],
      until: "2026-03-22",
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toContain("--until requires --since");
  });
});
