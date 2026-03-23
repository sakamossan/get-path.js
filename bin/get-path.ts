#!/usr/bin/env node

import { argv } from "zx";
import { run } from "../src/cli.js";

const result = await run(argv);

if (result.isOk()) {
  if (result.value) {
    console.log(result.value);
  }
} else {
  console.error(result.error);
  process.exit(1);
}
