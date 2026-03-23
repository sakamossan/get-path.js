import { err, type Result } from "neverthrow";
import { evaluateTemplate } from "../template.js";
import { buildVariables } from "../variables.js";

export async function handleGet(
  template: string
): Promise<Result<string, string>> {
  const varsResult = await buildVariables(template, new Date());
  if (varsResult.isErr()) return err(varsResult.error);

  return evaluateTemplate(template, varsResult.value);
}
