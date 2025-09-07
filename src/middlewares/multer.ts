import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express"; // added

export const uploadRootDir = path.join(process.cwd(), "uploads");

// Ensure base uploads directory exists at runtime
if (!fs.existsSync(uploadRootDir)) {
    fs.mkdirSync(uploadRootDir, { recursive: true });
}

export type UploaderConfig = {
    folder: "users" | "products" | string; // allow future folders
    fieldName: string; // form-data field name (e.g. "image")
    maxFileSizeMB?: number; // default 2MB
    allowedMimeTypes?: string[]; // default common images
    // Whether file is required (controller can also enforce). If false and no file sent, silently continue.
    required?: boolean;
};

function buildDestination(cfg: UploaderConfig) {
    const target = path.join(uploadRootDir, cfg.folder);
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
    return target;
}

// Safe filename generator – no DB side effects
function buildFilename(originalName: string) {
    const ext = path.extname(originalName).toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
        ? ext
        : ""; // drop unknown extension
    return `${Date.now()}_${crypto.randomBytes(6).toString("hex")}${safeExt}`;
}

// Factory returning a configured multer middleware + small wrapper for required logic
export function makeUploader(cfg: UploaderConfig) {
    const maxSize = (cfg.maxFileSizeMB ?? 2) * 1024 * 1024;
    const allowed = (
        cfg.allowedMimeTypes ?? [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
        ]
    ).map((m) => m.toLowerCase());

    const storage = multer.diskStorage({
        destination(_req, _file, cb) {
            try {
                cb(null, buildDestination(cfg));
            } catch (err) {
                cb(err as any, "");
            }
        },
        filename(_req, file, cb) {
            cb(null, buildFilename(file.originalname));
        },
    });

    const fileFilter = (
        _req: Express.Request,
        file: Express.Multer.File,
        cb: FileFilterCallback
    ) => {
        if (!allowed.includes(file.mimetype.toLowerCase())) {
            return cb(
                new Error(
                    `Unsupported file type: ${
                        file.mimetype
                    }. Allowed: ${allowed.join(", ")}`
                )
            );
        }
        cb(null, true);
    };

    const core = multer({
        storage,
        fileFilter,
        limits: { fileSize: maxSize },
    }).single(cfg.fieldName);

    // Wrapper to optionally enforce required + attach normalized path
    return function uploaderMiddleware(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        core(req as any, res as any, (err: any) => {
            if (err) return next(err);
            if (cfg.required && !req.file) {
                return next(new Error(`${cfg.fieldName} file is required`));
            }
            if ((req as any).file) {
                (req as any).uploadedFileRelativePath = `${cfg.folder}/${
                    (req as any).file.filename
                }`;
            }
            next();
        });
    };
}

// Backward compatible default (user images) – kept for existing imports, but refactored
const userImageUploader = makeUploader({ folder: "users", fieldName: "image" });
export default userImageUploader;

// Helper to build a public URL consistently
export function buildPublicUrl(relativePath: string) {
    // Relative path stored like: users/<filename>
    return `/uploads/${relativePath.replace(/\\/g, "/")}`; // served statically by express
}

// Cleanup helper for controllers to remove a freshly stored file on failure
export async function safeUnlink(relativePath?: string) {
    if (!relativePath) return;
    const abs = path.join(uploadRootDir, relativePath);
    try {
        await fs.promises.unlink(abs);
    } catch (err: any) {
        if (err.code !== "ENOENT") {
            console.error(`Failed to cleanup file ${relativePath}:`, err);
        }
    }
}
