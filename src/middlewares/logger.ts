import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

// Async helper to append a log entry (fire-and-forget)
export function logEvent(message: string, fileName: string) {
    const dateTime = new Date().toISOString();
    const logItem = `${dateTime}\t${message}\n`;

    const logsDir = path.join(__dirname, "..", "logs");
    const logFilePath = path.join(logsDir, fileName);

    // Always ensure directory exists, then append
    fs.promises
        .mkdir(logsDir, { recursive: true })
        .then(() => {
            fs.promises.appendFile(logFilePath, logItem, { encoding: "utf8" });
            console.log(logItem);
        })
        .catch((error) => {
            console.error(`[Error]: ${error} in logItem: ${logItem}`);
        });
}

// Express middleware
export default function logger(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        logEvent(`${req.method}\t${req.originalUrl} ${req.body}`, "reqLog.log");
    } catch (_) {
        // ignore
    }
    next();
}
