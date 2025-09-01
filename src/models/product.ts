import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    literal,
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

class Product extends Model<
    InferAttributes<Product>,
    InferCreationAttributes<Product>
> {
    declare id: CreationOptional<string>;
    declare name: string;
    // declare categoryId?: string;
    declare description: CreationOptional<string | null>;
    declare imageUrl: CreationOptional<string | null>;
    declare price: number;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare deletedAt: CreationOptional<Date>;
}

Product.init(
    {
        id: {
            type: UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
        deletedAt: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: "products",
        underscored: true,
        paranoid: true,
        timestamps: true,
    }
);

export default Product;
