import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import User from "../models/user";
import { ServiceError } from "../util/common/common";
import { UserQuery, imageUrl } from "../validations/userSchema";
import { SourceTextModule } from "vm";
import { StatusCodes } from "http-status-codes";
import path from "path";
import fs from "fs";
import { buildPublicUrl, safeUnlink } from "../middlewares/multer";
import sequelize from "../util/database";

// @desc    Fetch all users
// @route   GET /users
// @access  Private
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const {
        page,
        limit,
        sortBy,
        sortOrder,
        ...where
    }: {
        page: number;
        limit: number;
        sortBy: string;
        sortOrder: string;
    } = (req as any).validatedQuery as unknown as UserQuery;

    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sortBy, sortOrder]],
    });

    res.json({
        data: rows,
        pagination: {
            total: count,
            page: page,
            limit: limit,
            totalPage: Math.ceil(count / limit),
        },
    });
});

// @desc    Fetch a single user by ID
// @route   GET /users/:id
// @access  Private
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    if ((req as any).user) {
        res.json((req as any).user);
        return;
    }

    const id = req.params.userId;
    const user = await User.findByPk(id);
    if (!user) {
        throw new ServiceError("User not found", 404, "users:getUserById");
    }
    res.json(user);
});

// @desc    Create a new user
// @route   POST /users
// @access  Private
export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const payload = (req.body.user as User) || req.body;
    try {
        const created = await User.create({ ...payload });
        res.status(201).json(created);
    } catch (err: any) {
        // Default
        let status = StatusCodes.BAD_REQUEST;
        let message = "Failed to create user";

        // Sequelize validation / unique constraint errors structure
        // Detect common Sequelize error types without importing sequelize types
        const name = err?.name;

        if (name === "SequelizeUniqueConstraintError") {
            status = StatusCodes.CONFLICT; // 409
            // Collect fields causing conflict
            const fields =
                err?.errors?.map((e: any) => e.path).filter(Boolean) || [];
            if (fields.length) {
                message = `Duplicate value for field(s): ${fields.join(", ")}`;
            } else if (err?.parent?.detail) {
                message = err.parent.detail; // e.g. postgres detail text
            } else {
                message = "Duplicate value violates unique constraint";
            }
        } else if (name === "SequelizeValidationError") {
            status = StatusCodes.BAD_REQUEST; // 400
            const details = err?.errors?.map((e: any) => e.message) || [];
            message = details.length ? details.join(", ") : "Validation failed";
        } else if (name === "SequelizeForeignKeyConstraintError") {
            status = StatusCodes.BAD_REQUEST;
            const field =
                err?.index || err?.fields
                    ? Object.keys(err.fields).join(", ")
                    : "";
            message = field
                ? `Invalid reference for field(s): ${field}`
                : "Invalid foreign key reference";
        } else if (name === "SequelizeDatabaseError") {
            // Generic DB error (e.g., invalid syntax, out of range)
            status = StatusCodes.BAD_REQUEST;
            message =
                err?.parent?.detail ||
                err?.parent?.message ||
                err?.message ||
                message;
        } else if (err?.parent?.code === "23505") {
            // Postgres unique violation (fallback)
            status = StatusCodes.CONFLICT;
            message =
                err?.parent?.detail ||
                "Duplicate value violates unique constraint";
        } else if (err?.parent?.code === "23503") {
            // foreign key violation
            status = StatusCodes.BAD_REQUEST;
            message = err?.parent?.detail || "Foreign key constraint violation";
        } else if (err?.parent?.code === "23502") {
            // not null violation
            status = StatusCodes.BAD_REQUEST;
            message = err?.parent?.detail || "Required field missing";
        }

        throw new ServiceError(message, status, "users:createUser");
    }
});

// @desc    Update an existing user
// @route   PUT /users/:id
// @access  Private
// export const updateUserPut = asyncHandler(async (req: Request, res: Response) => {
//     const id = req.params.id || req.body.user?.id;
//     if (!id) {
//         throw new ServiceError("User id is required", 400, "users:update");
//     }
//     const existing = await User.findByPk(id);
//     if (!existing) {
//         throw new ServiceError("User not found", 404, "users:update");
//     }
//     const data = req.body.user ?? req.body; // allow either structure
//     const updated = await existing.update(data);
//     res.json(updated);
// });

// @desc    Update an existing user
// @route   PUT /users/:id
// @access  Private
export const updateUserPatch = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.userId || req.body.user?.id;
        if (!id) {
            throw new ServiceError("User id is required", 400, "users:update");
        }
        const existing = await User.findByPk(id);
        if (!existing) {
            throw new ServiceError("User not found", 404, "users:update");
        }
        const data = req.body.user ?? req.body; // allow either structure
        const updated = await existing.update(data);
        res.json(updated);
    }
);

// @desc    Delete a user
// @route   DELETE /users/:id
// @access  Private
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.userId || req.body.user?.id;
    if (!id) {
        throw new ServiceError("User id is required", 400, "users:delete");
    }
    const deletedCount = await User.destroy({ where: { id } });
    if (!deletedCount) {
        throw new ServiceError("User not found", 404, "users:delete");
    }
    res.status(200).json({ message: `Deleted user ${id} successfully` });
});

export const fileUpload = asyncHandler(async (req: Request, res: Response) => {
    // New approach: rely on (req as any).uploadedFileRelativePath provided by uploader factory
    if (!req.file || !(req as any).uploadedFileRelativePath) {
        throw new ServiceError("No file uploaded", 400, "users:fileUpload");
    }

    const user = await User.findByPk(req.params.userId);
    if (!user) {
        // cleanup the just-uploaded file if user not found
        await safeUnlink((req as any).uploadedFileRelativePath);
        throw new ServiceError("User not found", 404, "users:fileUpload");
    }

    // Store full relative path (e.g. users/filename) so we can resolve actual location later
    user.imageUrl = (req as any).uploadedFileRelativePath.replace(/\\/g, "/");
    await user.save();

    res.status(200).json({
        message: "Image uploaded",
        imageUrl: buildPublicUrl(user.imageUrl),
    });
});

export const fileDownload = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.userId || req.body.user?.id;
        if (!id) {
            throw new ServiceError("User id is required", 400, "users:delete");
        }

        const user = await User.findByPk(id);
        if (!user) {
            throw new ServiceError("User not found", 404, "users:fileDownload");
        }

        if (!user.imageUrl) {
            throw new ServiceError(
                "User has no image",
                404,
                "users:fileDownload"
            );
        }

        const absPath = path.join(process.cwd(), "uploads", user.imageUrl);
        fs.access(absPath, fs.constants.R_OK, (err) => {
            if (err) {
                res.status(404).json({ message: "Image file not found" });
            } else {
                res.download(absPath);
            }
        });
    }
);
