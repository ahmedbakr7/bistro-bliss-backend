import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "./verifyJWT";
import { User } from "../models";
import { ServiceError } from "../util/common/common";

// check if role is admin or check if req.auth.id == req.params.id
const isOwnerOrAdmin = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.auth) {
            throw new ServiceError(
                "Unauthorized",
                401,
                "middleware:isOwnerOrAdmin"
            );
        }
        const { id, role } = req.auth;
        const userId = req.params.userId;

        if (role === "admin") return next();

        if (id === userId) {
            return next();
        }

        throw new ServiceError("Forbidden", 403, "middleware:isOwnerOrAdmin");
    }
);

export default isOwnerOrAdmin;
