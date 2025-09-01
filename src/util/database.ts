import { debug } from "console";
import env from "./env";
import { Sequelize } from "sequelize";

const sequelize = new Sequelize({
    dialect: "postgres",
    database: env.PROJECT_NAME as string,
    host: env.DB_HOST as string,
    port: Number(env.DB_PORT),
    username: env.DB_USERNAME as string,
    password: env.DB_PASSWORD as string,
    logging: debug,
    define: {
        underscored: true,
        timestamps: true,
    },
});

export default sequelize;
