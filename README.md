# get-path.js

A CLI tool that generates path strings from template expressions.

Build path strings by evaluating JS expressions with built-in variables such as dates, environment variables, current directory info, and git metadata. Designed to let LLMs deterministically generate path strings that would otherwise require ad-hoc shell scripting.

## Install

```bash
npm install -g @sakamossan/get-path-js
```

## Usage

### get (default)

Evaluate a template and output the resulting path string to stdout. The subcommand name can be omitted.

```bash
get-path.js 'data/${cwd.basename}/${YYYY}${MM}${DD}/app.log'
# => data/my-app/20260324/app.log

get-path.js '${git.branch}/${git.commit.short}'
# => feature-x/a1b2c3d
```

### list

Evaluate the template for each day in a date range, glob-expand the results, and output existing file paths.

```bash
get-path.js list --since 2026-03-20 'logs/${cwd.basename}/${YYYY}-${MM}-${DD}/**/*.log'
```

| Option | Default | Description |
| --- | --- | --- |
| `--since` | today | Start date (YYYY-MM-DD) |
| `--until` | today | End date (YYYY-MM-DD) |

When only `--since` is specified, the range extends to today. When both are omitted, only today is evaluated. Specifying `--until` alone is an error.

Use pipes for filtering.

```bash
get-path.js list --since 2026-01-01 'logs/${YYYY}${MM}${DD}/**/*.log' | grep error
```

### write

Write stdin content to the file at the template-generated path. Parent directories are created automatically.

```bash
echo "hello" | get-path.js write '/tmp/${cwd.basename}/${YYYY}${MM}${DD}.txt'
```

| Option | Default | Description |
| --- | --- | --- |
| `--append` | false | Append to existing file instead of overwriting |

## Template Variables

Templates use JS template literal `${...}` syntax. Internally evaluated via Function constructor, so any JS expression is valid.

### Date

| Variable | Description | Example |
| --- | --- | --- |
| `YYYY` | 4-digit year | `2026` |
| `YY` | 2-digit year | `26` |
| `MM` | 2-digit month | `03` |
| `DD` | 2-digit day | `24` |
| `WW` | ISO week number | `13` |
| `EEE` | Abbreviated weekday | `Tue` |

### `cwd` — Current directory

| Property | Description |
| --- | --- |
| `cwd.fullpath` | Full path from `process.cwd()` |
| `cwd.basename` | Current directory name |
| `cwd.parentDir` | Parent directory name |

### `env` — Environment variables

`process.env` is available directly.

```bash
get-path.js '${env.HOME}/logs/${env.USER}/${YYYY}${MM}${DD}.log'
```

### `os` — OS information

Node.js `os` module is available directly.

```bash
get-path.js '${os.hostname()}/${os.platform()}/${YYYY}${MM}${DD}'
```

### `git` — Git metadata

| Property | Description |
| --- | --- |
| `git.branch` | Current branch name |
| `git.commit.short` | Abbreviated commit hash |
| `git.commit.long` | Full commit hash |

Git info is fetched only when the template contains `git.`. Using git variables outside a git repository results in an error.

## Security

The Function constructor allows arbitrary JS code in templates. This is intentional — templates are assumed to be authored by the developer, not sourced from external input.

## License

MIT
