import express from "express";
import userRouter from "./routes/userRoutes";
import categoryRouter from "./routes/categoryRoutes";
import bodyParser from "body-parser";
import session from "express-session";
import connect from "connect-session-sequelize";
import sequelize from "./util/database";
import logger from "./middlewares/logger";
import errorHandler, { errorHandler404 } from "./middlewares/errorHandler";
import cookieParser from "cookie-parser";
import cors from "cors";
import { corsOptions } from "./config/corsOptions";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import authRouter from "./routes/authRoutes";
import productRouter from "./routes/productRoutes";
import orderRouter from "./routes/orderRoutes";
import bookingRouter from "./routes/bookingRoutes";
import contactRouter from "./routes/contactRoutes";
import notificationRouter from "./routes/notificationRoutes";

// const SequelizeStore = connect(session.Store);
// app.use(
//     session({
//         secret: "",
//         resave: false,
//         saveUninitialized: false,
//         store: new SequelizeStore({ db: sequelize }),
//     })
// );

const app = express();

app.get("/openapi.json", (_req, res) => res.json(swaggerSpec));
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(logger);

// swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// raw openapi spec for Postman / tools import

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/categories", categoryRouter);
app.use("/products", productRouter);
app.use("/orders", orderRouter);
app.use("/bookings", bookingRouter);
app.use("/contacts", contactRouter);
app.use("/notifications", notificationRouter);

app.use(errorHandler404);

app.use(errorHandler);

export default app;
