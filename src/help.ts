import os from "node:os";
import { dateVars } from "./date-vars.js";
import { getGitInfo, getGitRemoteInfo, getRepoRelativePath } from "./git.js";
import { cwdVars } from "./variables.js";

// Column at which a value-cell's trailing note begins (value cells are short).
const NOTE_COLUMN = 16;

export const USAGE = [
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

// Tagged result per catalog entry. `kind` mirrors the four display forms and is
// designed to be reusable as a future `vars --json` `status` field.
type CatalogResult =
  | { kind: "value"; text: string; note?: string } // ① resolved value
  | { kind: "empty"; note?: string } // ② empty but valid (e.g. repo root)
  | { kind: "error"; reason: string } // ③ not usable in this context
  | { kind: "example"; text: string; unset?: boolean }; // ④ namespace/accessor sample

type Entry = { name: string; result: CatalogResult };
type Section = { header: string; entries: Entry[] };

function exampleOf(value: string | undefined): CatalogResult {
  if (value === undefined) return { kind: "example", text: "", unset: true };
  return { kind: "example", text: value };
}

function renderEntry(name: string, result: CatalogResult, pad: number): string {
  const left = `  ${name.padEnd(pad)}  `;
  switch (result.kind) {
    case "value":
    case "empty": {
      const cell = result.kind === "value" ? `= ${JSON.stringify(result.text)}` : `= ""`;
      return result.note ? left + cell.padEnd(NOTE_COLUMN) + result.note : left + cell;
    }
    case "error":
      return `${left}✗ ${result.reason}`;
    case "example":
      return left + (result.unset ? "e.g. (unset)" : `e.g. ${JSON.stringify(result.text)}`);
  }
}

/**
 * Build the live variable catalog as tagged sections. git is resolved once and
 * shared so a single subprocess covers branch/commit/owner/repo. Each variable
 * resolves independently, so one failure (e.g. outside a repo) degrades to an
 * `error` entry without taking down the rest of `--help`.
 */
async function buildCatalog(date: Date): Promise<Section[]> {
  const dateSection: Section = {
    header: "Date",
    entries: Object.entries(dateVars(date)).map(([name, text]): Entry => ({
      name: `\${${name}}`,
      result: { kind: "value", text },
    })),
  };

  const cwd = cwdVars();
  const cwdEntries: Entry[] = [
    { name: "${cwd.fullpath}", result: { kind: "value", text: cwd.fullpath } },
    { name: "${cwd.basename}", result: { kind: "value", text: cwd.basename } },
    { name: "${cwd.parentDir}", result: { kind: "value", text: cwd.parentDir } },
  ];

  // Independent git probes resolved concurrently (5 subprocesses → one batch).
  const [repoRel, gitInfo, remote] = await Promise.all([
    getRepoRelativePath(),
    getGitInfo(),
    getGitRemoteInfo(),
  ]);

  let fromRepoRoot: CatalogResult;
  if (repoRel.isErr()) {
    fromRepoRoot = { kind: "error", reason: repoRel.error };
  } else if (repoRel.value === "") {
    fromRepoRoot = { kind: "empty", note: "empty at repo root" };
  } else {
    fromRepoRoot = { kind: "value", text: repoRel.value };
  }
  cwdEntries.push({ name: "${cwd.fromRepoRoot}", result: fromRepoRoot });

  const cwdSection: Section = {
    header: "cwd — Current directory",
    entries: cwdEntries,
  };

  // owner/repo distinguish "not a repo" (gitInfo error) from "no origin"
  // (remote error) by checking gitInfo first, so the ✗ reason is accurate.
  const gitEntries: Entry[] = [];
  if (gitInfo.isErr()) {
    const result: CatalogResult = { kind: "error", reason: gitInfo.error };
    gitEntries.push(
      { name: "${git.branch}", result },
      { name: "${git.commit.short}", result },
      { name: "${git.commit.long}", result },
      { name: "${git.owner}", result },
      { name: "${git.repo}", result }
    );
  } else {
    const git = gitInfo.value;
    const [owner, repo]: CatalogResult[] = remote.isErr()
      ? [
          { kind: "error", reason: remote.error },
          { kind: "error", reason: remote.error },
        ]
      : [
          { kind: "value", text: remote.value.owner },
          { kind: "value", text: remote.value.repo },
        ];
    gitEntries.push(
      { name: "${git.branch}", result: { kind: "value", text: git.branch } },
      { name: "${git.commit.short}", result: { kind: "value", text: git.commit.short } },
      { name: "${git.commit.long}", result: { kind: "value", text: git.commit.long } },
      { name: "${git.owner}", result: owner },
      { name: "${git.repo}", result: repo }
    );
  }

  const gitSection: Section = {
    header: "git — Git metadata",
    entries: gitEntries,
  };

  const envSection: Section = {
    header: "env — process.env (any key; examples)",
    entries: [
      { name: "${env.HOME}", result: exampleOf(process.env.HOME) },
      { name: "${env.USER}", result: exampleOf(process.env.USER) },
    ],
  };

  const osSection: Section = {
    header: "os — node:os module (any member; examples)",
    entries: [
      { name: "${os.hostname()}", result: exampleOf(os.hostname()) },
      { name: "${os.platform()}", result: exampleOf(os.platform()) },
    ],
  };

  return [dateSection, cwdSection, gitSection, envSection, osSection];
}

/**
 * Static USAGE plus a live variable catalog resolved for the current context.
 * Doubles as a pre-run capability probe: each entry shows the actual value here,
 * or why the variable cannot resolve (with the same condition that fails at
 * template time, since the `✗` reasons come straight from src/git.ts).
 */
export async function renderHelp(): Promise<string> {
  const sections = await buildCatalog(new Date());
  const pad = Math.max(...sections.flatMap((s) => s.entries).map((e) => e.name.length));

  const body = sections
    .map((section) => {
      const lines = section.entries.map((e) => renderEntry(e.name, e.result, pad));
      return `${section.header}\n${lines.join("\n")}`;
    })
    .join("\n\n");

  return [USAGE, "Template Variables (resolved for the current context)", body].join("\n\n");
}
