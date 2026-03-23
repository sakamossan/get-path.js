import { ok, err, type Result } from "neverthrow";
import { parse } from "date-fns/parse";
import { isValid } from "date-fns/isValid";
import { eachDayOfInterval } from "date-fns/eachDayOfInterval";
import { z } from "zod";
import { glob } from "glob";
import { access } from "node:fs/promises";
import { evaluateTemplate } from "../template.js";
import { buildVariables } from "../variables.js";

const dateStringSchema = z.string().transform((val, ctx) => {
  const parsed = parse(val, "yyyy-MM-dd", new Date());
  if (!isValid(parsed)) {
    ctx.addIssue({
      code: "custom",
      message: `Invalid date: "${val}". Use YYYY-MM-DD format.`,
    });
    return z.NEVER;
  }
  return parsed;
});

function hasGlobChars(s: string): boolean {
  return /[*?[\]]/.test(s);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function handleList(
  template: string,
  argv: { since?: string; until?: string }
): Promise<Result<string, string>> {
  const today = new Date();

  if (argv.until && !argv.since) {
    return err("Error: --until requires --since");
  }

  let sinceDate: Date;
  let untilDate: Date;

  if (argv.since) {
    const parsed = dateStringSchema.safeParse(argv.since);
    if (!parsed.success) return err(z.prettifyError(parsed.error));
    sinceDate = parsed.data;
  } else {
    sinceDate = today;
  }

  if (argv.until) {
    const parsed = dateStringSchema.safeParse(argv.until);
    if (!parsed.success) return err(z.prettifyError(parsed.error));
    untilDate = parsed.data;
  } else {
    untilDate = today;
  }

  const days = eachDayOfInterval({ start: sinceDate, end: untilDate });
  const allPaths = new Set<string>();

  for (const day of days) {
    const varsResult = await buildVariables(template, day);
    if (varsResult.isErr()) return err(varsResult.error);

    const pathResult = evaluateTemplate(template, varsResult.value);
    if (pathResult.isErr()) return pathResult;

    const evaluated = pathResult.value;

    if (hasGlobChars(evaluated)) {
      const matches = await glob(evaluated, { dot: true });
      for (const match of matches) {
        allPaths.add(match);
      }
    } else {
      if (await fileExists(evaluated)) {
        allPaths.add(evaluated);
      }
    }
  }

  return ok([...allPaths].join("\n"));
}
