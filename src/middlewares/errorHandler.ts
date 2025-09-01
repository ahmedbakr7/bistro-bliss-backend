import { NextFunction, Request, Response } from "express";
import { ServiceError } from "../util/common/common";
import { logEvent } from "./logger";

export default function errorHandler(
    error: ServiceError,
    req: Request,
    res: Response,
    next: NextFunction
) {
    logEvent(
        `${error.name}: ${error.source} ${error.message}\t${req.method}\t${req.url}\t${
            req.get("origin") ?? ""
        }`,
        "errLog.log"
    );
    console.log(error.stack);

    error.status = error.status ?? 500;
    res.status(error.status).json(error.message);
}

export function errorHandler404(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const error: ServiceError = {
        name: "NotFound",
        status: 404,
        message: `Not Found - ${req.originalUrl}`,
        source: "Invalid URL",
    };
    next(error);
}
