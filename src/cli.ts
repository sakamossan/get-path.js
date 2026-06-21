import { ok, err, type Result } from "neverthrow";
import { USAGE, renderHelp } from "./help.js";
import { handleGet } from "./subcommands/get.js";
import { handleList } from "./subcommands/list.js";
import { handleWrite } from "./subcommands/write.js";

const SUBCOMMANDS = ["get", "list", "write"] as const;
type Subcommand = (typeof SUBCOMMANDS)[number];

type Argv = {
  _: string[];
  since?: string;
  until?: string;
  append?: boolean;
  help?: boolean;
};

export async function run(argv: Argv): Promise<Result<string, string>> {
  if (argv.help) {
    return ok(await renderHelp());
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
    return err(
      `Error: template is required\n\n${USAGE}\n\nRun get-path.js --help for the full variable list.`
    );
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
