import { createClient } from "redis";
import env from "./env";
import { User } from "../models";

export type TokenType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

export type RecordData = User | string;

export type RedisQuery = `VERIFY/${string}` | `FORGET/${string}`;

const redisClient = createClient({ url: env.REDIS_URL as string });

redisClient.on("error", (err) => {
    console.error("Redis Client Error: ", err);
});

let isConnected = false;

export async function initRedis(): Promise<void> {
    if (isConnected) return;
    try {
        await redisClient.connect();
        isConnected = true;
        console.log("Redis connected");
    } catch (err) {
        console.error("Failed to connect to Redis", err);
    }
}

export default redisClient;
