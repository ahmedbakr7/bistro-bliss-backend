import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { User } from "../models";
import { ServiceError } from "../util/common/common";

export const loadUserByParam = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.userId;
        const user = await User.findByPk(id);
        if (!user) {
            throw new ServiceError(
                "User not found",
                404,
                "middleware:loadUser"
            );
        }
        (req as any).user = user;
        return next()
    }
);
