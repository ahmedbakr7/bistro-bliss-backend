import {
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
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    literal,
    Model,
    UUID,
    UUIDV4,
} from "sequelize";
import sequelize from "../util/database";

class Category extends Model<
    InferAttributes<Category>,
    InferCreationAttributes<Category>
> {
    declare id: CreationOptional<string>;
    declare name: string;
    declare description: string;
    // declare parentId: CreationOptional<string | null>;
    declare imageUrl: CreationOptional<string | null>;
    declare createdAt: Date;
    declare updatedAt: Date;
    declare deletedAt: Date;
}

Category.init(
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
        tableName: "categories",
        underscored: true,
        paranoid: true,
        timestamps: true,
    }
);

export default Category;
