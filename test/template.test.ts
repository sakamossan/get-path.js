import { describe, test, expect } from "vitest";
import { evaluateTemplate } from "../src/template";

describe("evaluateTemplate", () => {
  test("simple variable substitution", () => {
    const result = evaluateTemplate("hello ${name}", { name: "world" });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe("hello world");
  });

  test("nested object access", () => {
    const result = evaluateTemplate("${cwd.basename}/file", {
      cwd: { basename: "my-app" },
    });
    expect(result._unsafeUnwrap()).toBe("my-app/file");
  });

  test("multiple variables", () => {
    const result = evaluateTemplate("${YYYY}/${MM}/${DD}", {
      YYYY: "2026",
      MM: "03",
      DD: "22",
    });
    expect(result._unsafeUnwrap()).toBe("2026/03/22");
  });

  test("JS expression in template", () => {
    const result = evaluateTemplate("${name.toUpperCase()}", {
      name: "hello",
    });
    expect(result._unsafeUnwrap()).toBe("HELLO");
  });

  test("returns error for syntax error in template", () => {
    const result = evaluateTemplate("${???}", {});
    expect(result.isErr()).toBe(true);
  });
});
