import { Request, Response, NextFunction } from "express";
import redisClient from "../util/redis";

// Simple cache middleware: caches successful JSON responses for given key builder
export function cache(keyBuilder: (req: Request) => string, ttlSeconds = 60) {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!redisClient.isOpen) return next();
        const key = keyBuilder(req);
        try {
            const cached = await redisClient.get(key);
            if (cached) {
                res.setHeader("X-Cache", "HIT");
                return res.json(JSON.parse(cached));
            }
        } catch (e) {
            // ignore cache errors
        }

        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
            if (res.statusCode === 200) {
                try {
                    void redisClient.set(key, JSON.stringify(body), {
                        EX: ttlSeconds,
                    });
                } catch {}
            }
            return originalJson(body);
        };
        next();
    };
}
