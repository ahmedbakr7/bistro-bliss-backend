import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    UUID,
    ForeignKey,
    NonAttribute,
} from "sequelize";
import sequelize from "../util/database";
import User from "./user";

export type NotificationType =
    | "RESERVATION_CONFIRMED"
    | "ORDER_READY"
    | "NEW_RESERVATION"
    | "NEW_ORDER"
    | "ORDER_ACCEPTED"
    | "ORDER_OUT_FOR_DELIVERY"
    | "ORDER_DELIVERED";

class Notification extends Model<
    InferAttributes<Notification>,
    InferCreationAttributes<Notification>
> {
    declare id: CreationOptional<string>;
    declare userId: ForeignKey<User["id"] | null>; // recipient user; could be null for broadcast (future)
    declare type: NotificationType;
    declare message: string;
    declare readAt: Date | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare deletedAt: CreationOptional<Date>;

    declare user?: NonAttribute<User>;
}

Notification.init(
    {
        id: {
            type: UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        type: {
            type: DataTypes.ENUM(
                "RESERVATION_CONFIRMED",
                "ORDER_READY",
                "NEW_RESERVATION",
                "NEW_ORDER",
                "ORDER_ACCEPTED",
                "ORDER_OUT_FOR_DELIVERY",
                "ORDER_DELIVERED"
            ),
            allowNull: false,
        },
        userId: {
            type: UUID,
            allowNull: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
        deletedAt: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: "notifications",
        underscored: true,
        paranoid: true,
        timestamps: true,
        indexes: [
            {
                name: "notifications_user_read_idx",
                fields: ["user_id", "read_at"],
            },
            { name: "notifications_type_idx", fields: ["type"] },
        ],
    }
);

export default Notification;
