import "server-only";

type LogValue = string | number | boolean | null | undefined;
type LogContext = Record<string, LogValue>;

function entry(level: "info" | "warn" | "error", event: string, context: LogContext) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  });
}

export function logInfo(event: string, context: LogContext = {}) {
  console.info(entry("info", event, context));
}

export function logWarn(event: string, context: LogContext = {}) {
  console.warn(entry("warn", event, context));
}

export function logError(event: string, context: LogContext = {}) {
  console.error(entry("error", event, context));
}
