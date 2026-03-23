import { err, type Result } from "neverthrow";
import { handleGet } from "./subcommands/get.js";
import { handleList } from "./subcommands/list.js";
import { handleWrite } from "./subcommands/write.js";

const SUBCOMMANDS = ["get", "list", "write"] as const;
type Subcommand = (typeof SUBCOMMANDS)[number];

const USAGE = [
  "Usage: get-path [subcommand] [options] <template>",
  "",
  "Subcommands:",
  "  get   (default) Evaluate template and output the result",
  "  list  Evaluate template for date range, glob expand, output existing paths",
  "  write Write stdin to the path generated from template",
  "",
  "Options (list):",
  "  --since YYYY-MM-DD  Start date (default: today)",
  "  --until YYYY-MM-DD  End date (default: today)",
  "",
  "Options (write):",
  "  --append  Append to file instead of overwriting",
].join("\n");

type Argv = {
  _: string[];
  since?: string;
  until?: string;
  append?: boolean;
  help?: boolean;
};

export async function run(argv: Argv): Promise<Result<string, string>> {
  if (argv.help) {
    return err(USAGE);
  }

  let subcommand: Subcommand;
  let template: string;

  const first = argv._[0];

  if (first && SUBCOMMANDS.includes(first as Subcommand)) {
    subcommand = first as Subcommand;
    template = argv._[1];
  } else {
    subcommand = "get";
    template = first;
  }

  if (!template) {
    return err(`Error: template is required\n\n${USAGE}`);
  }

  switch (subcommand) {
    case "get":
      return handleGet(template);
    case "list":
      return handleList(template, {
        since: argv.since,
        until: argv.until,
      });
    case "write":
      return handleWrite(template, {
        append: argv.append,
      });
  }
}
