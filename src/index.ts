import app from "./server";
import env from "./util/env";
import sequelize from "./util/database";
import "./models/index";
import { initRedis } from "./util/redis";

const PORT = env.PORT || 3000;

sequelize
    .sync({
        force:
            env.DB_CLEAR_ON_START === "true" && env.NODE_ENV === "development",
    })
    .then(async () => {
        console.log("Database Connected!!");
        if (
            env.DB_CLEAR_ON_START === "true" &&
            env.NODE_ENV === "development"
        ) {
        }
    })
    .catch((reason: Error) => {
        console.log(`Database Error: ${reason}`);
    });

const server = app.listen(PORT, () => {
    console.log(`listening to localhost:${PORT}`);
});

// connect redis
initRedis()

// Graceful shutdown
process.on("SIGINT", async () => {
    const { default: redis } = await import("./util/redis");
    try {
        await redis.quit();
    } catch {}
    server.close(() => process.exit(0));
});

server.on("error", (error) => {
    if ("code" in error && (error as any).code === "EADDRINUSE") {
        console.error(
            `Port ${PORT} is already in use. Please choose another port or stop the process using it.`
        );
    } else {
        console.error("failed to start server: ", error);
    }
    process.exit(1);
});
