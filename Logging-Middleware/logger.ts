// logger.ts
export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "FATAL";

export interface LogPayload {
  stack: string;
  level: LogLevel;
  package: string;
  message: string;
}

export async function Log(
  stack: string,
  level: LogLevel,
  packageName: string,
  message: string
): Promise<void> {
  const payload: LogPayload = {
    stack,
    level,
    package: packageName,
    message,
  };

  try {
    await fetch("http://20.244.56.144/evaluation-service/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    console.log(`Log sent: [${level}] ${message}`);
  } catch (error) {
    console.error("Failed to send log:", error);
  }
}
