import { allowedOrigins } from "./allowedorigins";
import { CorsOptions } from "cors";
import { ServiceError } from "../util/common/common";

export const corsOptions: CorsOptions = {
    origin(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(
            new ServiceError("Not allowed by CORS", 403, "cors:origin")
        );
    },
    credentials: true,
    optionsSuccessStatus: 200,
};
