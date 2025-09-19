import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import User from "../models/user";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import env from "../util/env";
import { ServiceError } from "../util/common/common";
import { StatusCodes } from "http-status-codes";
import redisClient from "../util/redis";
import { RedisQuery } from "../util/redis";
import crypto from "crypto";
import { sendMail } from "../util/nodemailer";
import { buildVerificationEmail } from "../util/emailTemplates";
import { create } from "domain";
import { safeUnlink } from "../middlewares/multer"; // added for cleanup of uploaded image on failure
import { Order, OrderDetails } from "../models"; // added for cart & favourites retrieval

const ACCESS_TOKEN_EXPIRES = "15m"; // Unchanged semantics (Reason: explicit constant)
const REFRESH_TOKEN_EXPIRES = "7d"; // Extended to 7d (Reason: typical longer-lived refresh vs access token)
const ACCESS_TOKEN_ALGORITHMS: jwt.Algorithm[] = ["HS256"]; // Restrict algorithms (Reason: mitigate algorithm confusion)
const REFRESH_TOKEN_ALGORITHMS: jwt.Algorithm[] = ["HS256"]; // Same restriction (Reason: consistency & security)
const COOKIE_NAME = "jwt"; // Single source (Reason: prevents typos)
const IS_PROD = process.env.NODE_ENV === "production"; // Env-based security toggles (Reason: secure cookies in production)
const VERIFY_TOKEN_EXPIRES = 60 * 30; // 60 sec * minutes

// Helper token generators (hex or numeric)
function generateHexToken(bytes = 16) {
    // 16 bytes -> 32 hex chars
    return crypto.randomBytes(bytes).toString("hex");
}
function generateNumericCode(length = 6) {
    // 6-digit numeric code
    let code = "";
    for (let i = 0; i < length; i++) {
        code += crypto.randomInt(0, 10).toString();
    }
    return code;
}

// Augmented payload interfaces (Reason: clarity & type safety)
export interface JwtPayload {
    userId: string;
    role: string;
}

// Helper: sign access token (Reason: remove duplication & unify claims)
function signAccessToken(user: User): string {
    return jwt.sign(
        { userId: user.id, role: user.role } as JwtPayload,
        env.ACCESS_TOKEN_SECRET as string,
        {
            expiresIn: ACCESS_TOKEN_EXPIRES,
            algorithm: ACCESS_TOKEN_ALGORITHMS[0], // Explicit (Reason: enforce desired algorithm)
            // issuer, audience can be added here (Reason: stronger validation) TODO.
        }
    );
}

function signRefreshToken(user: User): string {
    return jwt.sign(
        { userId: user.id } as JwtPayload,
        env.REFRESH_TOKEN_SECRET as string,
        {
            expiresIn: REFRESH_TOKEN_EXPIRES,
            algorithm: REFRESH_TOKEN_ALGORITHMS[0],
        }
    );
}

// Helper: common cookie options builder (Reason: centralize security options)
function refreshCookieOptions() {
    return {
        httpOnly: true, // Mitigate XSS (Reason: disallow JS access)
        secure: IS_PROD, // Only over HTTPS in production (Reason: cookie confidentiality)
        sameSite: IS_PROD ? ("none" as const) : ("lax" as const), // Use lax locally for easier testing; none for cross-site if needed (Reason: CSRF balance)
        path: "/", // Explicit (Reason: clarity)
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (Reason: aligns with REFRESH_TOKEN_EXPIRES)
    };
}

// @desc    User registration (now supports optional multipart form with image upload)
// @route   POST /auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response) => {
    const payload = (req.body.user as User) || req.body;

    // If an image file was uploaded by multer factory (makeUploader), attach its relative path (e.g. users/filename)
    if (req.file && (req as any).uploadedFileRelativePath) {
        payload.imageUrl = (req as any).uploadedFileRelativePath.replace(
            /\\/g,
            "/"
        );
    }

    try {
        const created = await User.create({ ...payload });
        // Use short numeric code for user-friendly email + separate longer hex token if needed
        const token = generateNumericCode(6); // or generateHexToken(3) for 6 hex chars
        const query: RedisQuery = `VERIFY/${token}`;
        redisClient.set(query, created.id, {
            EX: VERIFY_TOKEN_EXPIRES,
            NX: true,
        });

        sendMail({
            to: created.email,
            html: buildVerificationEmail({
                code: token,
                verifyUrl: `${
                    process.env.APP_BASE_URL || "http://localhost:3000"
                }/email/verify/${token}`,
                userName: created.name,
            }),
            subject: "Email Verification",
        });

        res.status(201).json(created);
    } catch (err: any) {
        // If we already stored a file for this (failed) registration, remove it to avoid orphan files
        await safeUnlink((req as any).uploadedFileRelativePath);
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

// @desc    Login endpoint
// @route   POST /auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await User.scope("withPassword").findOne({
        where: { email: email },
    });

    if (!user) {
        throw new ServiceError("Invalid credentials", 401, "auth:login");
    }

    if (!(await user.checkPassword(password))) {
        throw new ServiceError("Invalid credentials", 401, "auth:login");
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.cookie(COOKIE_NAME, refreshToken, refreshCookieOptions());

    // Fetch / ensure cart & favourites plus their line items
    let cart: any = null;
    let favourites: any = null;
    try {
        cart = await (Order as any).getOrCreateCart(user.id);
        favourites = await (Order as any).getOrCreateFavourites(user.id);
    } catch (e) {
        // Non-fatal: proceed without cart/favourites if creation failed
        console.error("Failed to ensure cart/favourites for user", user.id, e);
    }

    const [cartItems, favouriteItems] = await Promise.all([
        cart
            ? OrderDetails.findAll({ where: { orderId: cart.id } as any })
            : Promise.resolve([]),
        favourites
            ? OrderDetails.findAll({ where: { orderId: favourites.id } as any })
            : Promise.resolve([]),
    ]);

    res.json({
        accessToken,
        user: { id: user.id, name: user.name, role: user.role },
        cart: cart ? { id: cart.id, items: cartItems } : null,
        favourites: favourites
            ? { id: favourites.id, items: favouriteItems }
            : null,
    });
});

// @desc    Refresh access token
// @route   POST /auth/refresh
// @access  Public (but requires valid refresh cookie)
export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const cookies = req.cookies;
    const existingRefresh = cookies?.[COOKIE_NAME];
    if (!existingRefresh) {
        throw new ServiceError(
            "Unauthorized - missing token",
            401,
            "auth:refresh"
        );
    }

    try {
        const decoded = jwt.verify(
            existingRefresh,
            env.REFRESH_TOKEN_SECRET as string,
            {
                algorithms: REFRESH_TOKEN_ALGORITHMS,
            }
        ) as JwtPayload;

        const user = await User.findByPk(decoded.userId);
        if (!user) {
            throw new ServiceError(
                "Unauthorized user removed",
                401,
                "auth:refresh"
            );
        }

        const newRefreshToken = signRefreshToken(user);
        res.cookie(COOKIE_NAME, newRefreshToken, refreshCookieOptions());

        const accessToken = signAccessToken(user);
        res.json({
            accessToken,
            user: { id: user.id, name: user.name, role: user.role },
        });
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            throw new ServiceError(
                "Unauthorized - Refresh token expired",
                401,
                "auth:refresh"
            );
        }
        if (err instanceof JsonWebTokenError) {
            throw new ServiceError(
                "Unauthorized - Invalid refresh token",
                401,
                "auth:refresh"
            );
        }
        throw new ServiceError(
            "Unauthorized - Refresh failed",
            401,
            "auth:refresh"
        ); // Fallback (Reason: generic safety)
    }
});

// @desc    Logout endpoint - clear cookie
// @route   POST /auth/logout
// @access  Public (requires existing session cookie)
export const logout = asyncHandler(async (req: Request, res: Response) => {
    const cookies = req.cookies;
    if (!cookies?.[COOKIE_NAME]) {
        res.status(204).end();
        return;
    }

    res.clearCookie(COOKIE_NAME, {
        ...refreshCookieOptions(),
        maxAge: undefined, // Remove maxAge (Reason: clearCookie ignores; avoids confusion)
    });
    res.status(204).end();
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params;
    if (!code) throw new ServiceError("code required", 400, "auth:verifyEmail");

    const query: RedisQuery = `VERIFY/${code}`;
    const raw = await redisClient.get(query);
    if (!raw)
        throw new ServiceError(
            "invalid or expired token",
            400,
            "auth:verifyEmail"
        );

    let payload: any;
    try {
    } catch {
        // Corrupted payload -> remove and abort
        throw new ServiceError("corrupted token", 400, "auth:verifyEmail");
    } finally {
        redisClient.del(query);
    }

    res.status(201).json("account verified");
});

export const sendResetPassword = asyncHandler(
    async (req: Request, res: Response) => {
        const { email } = req.body;
        if (!email) {
            throw new ServiceError(
                "email required",
                400,
                "auth:sendResetPassword"
            );
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            // do not reveal user existence
            res.json("email sent");
            return;
        }

        // Longer hex token for password reset link/code
        const token = generateHexToken(16); // 32 hex chars (128 bits)
        const query: RedisQuery = `FORGET/${token}`; // using existing union type
        await redisClient.set(
            query,
            JSON.stringify({ id: user.id, email: user.email }),
            {
                EX: VERIFY_TOKEN_EXPIRES,
                NX: true,
            }
        );

        const resetUrl = `${
            process.env.APP_BASE_URL || "http://localhost:3000"
        }/password/reset/${token}`;
        const html = `<p>Hello ${
            user.name || ""
        },</p><p>Your password reset token is <strong>${token}</strong>.</p><p>Or click: <a href="${resetUrl}">${resetUrl}</a></p><p>This token expires in 15 minutes. If you did not request it you can ignore this email.</p>`;
        sendMail({ to: email, subject: "Password Reset", html });

        res.json("email sent");
    }
);

export const resetPassword = asyncHandler(
    async (req: Request, res: Response) => {
        const { newPassword, token } = req.body;

        const query: RedisQuery = `FORGET/${token}`;
        const raw = await redisClient.get(query);
        if (!raw) {
            throw new ServiceError(
                "invalid or expired token",
                400,
                "auth:resetPassword"
            );
        }

        let payload: { id: string; email: string };
        try {
            payload = JSON.parse(raw);
        } catch {
            await redisClient.del(query);
            throw new ServiceError(
                "corrupted token",
                400,
                "auth:resetPassword"
            );
        }

        const user = await User.findByPk(payload.id);
        if (!user || user.email !== payload.email) {
            await redisClient.del(query);
            throw new ServiceError(
                "invalid token context",
                400,
                "auth:resetPassword"
            );
        }

        (user as any).password = newPassword; // triggers hash setter
        await user.save();
        await redisClient.del(query);

        res.json("password reset successful");
    }
);
