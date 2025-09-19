import {
    DataTypes,
    CreationOptional,
    InferAttributes,
    InferCreationAttributes,
    Model,
    UUID,
    ForeignKey,
    Association,
    HasManyAddAssociationMixin,
    HasManyCountAssociationsMixin,
    HasManyCreateAssociationMixin,
    HasManyGetAssociationsMixin,
    HasManyHasAssociationMixin,
    HasManySetAssociationsMixin,
    HasManyAddAssociationsMixin,
    HasManyHasAssociationsMixin,
    HasManyRemoveAssociationMixin,
    HasManyRemoveAssociationsMixin,
    ModelDefined,
    Optional,
    Sequelize,
    NonAttribute,
} from "sequelize";
import sequelize from "../util/database";

export type OrderStatus =
    | "CANCELED"
    | "FAVOURITES"
    | "DRAFT"
    | "CREATED"
    | "PREPARING"
    | "READY"
    | "DELIVERING"
    | "RECEIVED";

export class Order extends Model<
    InferAttributes<Order>,
    InferCreationAttributes<Order>
> {
    declare id: CreationOptional<string>;
    declare status: CreationOptional<OrderStatus>;
    declare userId: ForeignKey<string | null>;
    // declare ?: ForeignKey<string>;

    declare totalPrice?: number; // optional until confirmed field requirements
    declare acceptedAt: CreationOptional<string | null>;
    declare deliveredAt: CreationOptional<string | null>;
    declare receivedAt: CreationOptional<string | null>;

    declare createdAt: Date;
    declare updatedAt: Date;
    declare deletedAt: Date; // because paranoid: true
}

Order.init(
    {
        id: {
            type: UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        status: {
            type: DataTypes.ENUM(
                "CANCELED",
                "FAVOURITES",
                "DRAFT",
                "CREATED",
                "PREPARING",
                "READY",
                "DELIVERING",
                "RECEIVED"
            ),
            defaultValue: "DRAFT",
            allowNull: false,
        },
        totalPrice: {
            // adjust precision/scale as needed
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        acceptedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        deliveredAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        receivedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
        deletedAt: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: "orders",
        underscored: true,
        paranoid: true,
        timestamps: true,
        // Added index for faster status lookups per user (implements part of suggestion #3)
        indexes: [
            { name: "orders_user_status_idx", fields: ["user_id", "status"] },
        ],
    }
);

// Helper static methods to ensure single cart / favourites per user
(Order as any).getOrCreateCart = async function (userId: string, t?: any) {
    const existing = await Order.findOne({
        where: { userId, status: "DRAFT" },
        transaction: t,
    });
    if (existing) return existing;
    return Order.create({ userId, status: "DRAFT" } as any, { transaction: t });
};
(Order as any).getOrCreateFavourites = async function (
    userId: string,
    t?: any
) {
    const existing = await Order.findOne({
        where: { userId, status: "FAVOURITES" },
        transaction: t,
    });
    if (existing) return existing;
    return Order.create({ userId, status: "FAVOURITES" } as any, {
        transaction: t,
    });
};

export default Order;
