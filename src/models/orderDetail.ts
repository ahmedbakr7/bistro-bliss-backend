import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    UUID,
    UUIDV4,
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
    ForeignKey,
} from "sequelize";
import sequelize from "../util/database";

class OrderDetails extends Model<
    InferAttributes<OrderDetails>,
    InferCreationAttributes<OrderDetails>
> {
    declare id: CreationOptional<string>;
    declare orderId: ForeignKey<string>;
    declare productId: ForeignKey<string>;
    declare quantity: number;
    declare price_snapshot: CreationOptional<number>;
    declare name_snapshot: CreationOptional<string>;
    declare createdAt: Date;
    declare updatedAt: Date;
    declare deletedAt: Date;
}

OrderDetails.init(
    {
        id: {
            type: UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        orderId: { type: UUID, allowNull: false },
        productId: { type: UUID, allowNull: false },
        name_snapshot: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        price_snapshot: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
        deletedAt: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: "order_details",
        underscored: true,
        timestamps: true,
        // Composite unique index to enforce one product per order (ignoring soft-deleted rows)
        indexes: [
            {
                name: "order_details_order_product_unique",
                unique: true,
                fields: ["order_id", "product_id", "deleted_at"],
            },
            { name: "order_details_order_idx", fields: ["order_id"] },
            { name: "order_details_product_idx", fields: ["product_id"] },
        ],
    }
);

export default OrderDetails;
