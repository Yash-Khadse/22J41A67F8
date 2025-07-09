import { Request, Response, NextFunction } from "express";
import { Log } from "../../../Logging-Middleware/logger";

export async function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  await Log(
    "requestLogger",
    "INFO",
    "url-shortener",
    `Incoming ${req.method} ${req.originalUrl}`
  );
  next();
}

export async function errorLogger(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  await Log("errorLogger", "ERROR", "url-shortener", `${err.message || err}`);
  next(err);
}
