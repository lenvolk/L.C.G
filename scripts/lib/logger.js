#!/usr/bin/env node

import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

function ts() {
  return new Date().toISOString();
}

export function createLogger(taskName, vaultDir, date) {
  const logsDir = join(vaultDir, "_lcg", "logs");
  mkdirSync(logsDir, { recursive: true });

  const logFile = join(logsDir, `${date}-${taskName}.log`);

  function log(message) {
    const line = `[${ts()}] ${message}`;
    console.log(line);
    try {
      appendFileSync(logFile, `${line}\n`, "utf-8");
    } catch {
      // Logging should never break task execution.
    }
  }

  return { log, logFile };
}
