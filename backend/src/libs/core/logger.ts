type LogLevel = "info" | "warn" | "error";

const write = (level: LogLevel, message: string): void => {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] ${message}`);
};

export const logger = {
  info: (message: string): void => write("info", message),
  warn: (message: string): void => write("warn", message),
  error: (message: string): void => write("error", message)
};
