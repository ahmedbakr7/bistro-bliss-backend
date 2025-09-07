import app from "./server";
import env from "./util/env";
import sequelize from "./util/database";
import "./models/index";
import { initRedis } from "./util/redis";

const PORT = env.PORT || 3000;

async function seedAll() {
    // Dynamically import to avoid circular deps / unnecessary cost if not needed
    try {
        const [
            { default: seedUsers },
            { default: seedProducts },
            { default: seedContacts },
            { default: seedBookings },
            { default: seedMenuImageProducts }, // corrected import
        ] = await Promise.all([
            import("./seed/seedUsers"),
            import("./seed/seedProducts"),
            import("./seed/seedContacts"),
            import("./seed/seedBookings"),
            import("./seed/seedMenuImageProducts"), // corrected path
        ]);
        await seedUsers();
        // await seedProducts();
        await seedContacts();
        await seedMenuImageProducts();
        // await seedBookings();
    } catch (err) {
        console.error("Seeding failed", err);
    }
}

sequelize
    .sync({
        force:
            env.DB_CLEAR_ON_START === "true" && env.NODE_ENV === "development",
    })
    .then(async () => {
        console.log("Database Connected!!");
        // Seed data every start (can guard by env if desired)
        await seedAll();
        const server = app.listen(PORT, () => {
            console.log(`listening to localhost:${PORT}`);
        });

        // connect redis
        initRedis();

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
    })
    .catch((reason: Error) => {
        console.log(`Database Error: ${reason}`);
        process.exit(1);
    });
