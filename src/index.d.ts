import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { Logger } from "pino";

interface IConfig {
  name?: string;
  recordIp?: boolean;
  recordHeaders?: boolean;
}

export function getLoggerMiddleware(
  config?: IConfig
): (req: Request, res: Response, next: NextFunction) => void;
export function getLogReqMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
export function getErrorHandlerMiddleware(): ErrorRequestHandler;
export const Logger: Logger;
