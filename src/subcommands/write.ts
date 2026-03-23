import { mkdir, appendFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ok, err, type Result } from "neverthrow";
import { evaluateTemplate } from "../template.js";
import { buildVariables } from "../variables.js";

export async function handleWrite(
  template: string,
  argv: { append?: boolean }
): Promise<Result<string, string>> {
  const varsResult = await buildVariables(template, new Date());
  if (varsResult.isErr()) return err(varsResult.error);

  const pathResult = evaluateTemplate(template, varsResult.value);
  if (pathResult.isErr()) return pathResult;

  const filePath = pathResult.value;
  await mkdir(path.dirname(filePath), { recursive: true });

  const input = readFileSync(0, "utf-8");

  if (argv.append) {
    await appendFile(filePath, input);
  } else {
    await writeFile(filePath, input);
  }

  return ok("");
}
