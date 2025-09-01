import {
    DataTypes,
    CreationOptional,
    InferAttributes,
    InferCreationAttributes,
    Model,
    UUID,
} from "sequelize";
import sequelize from "../util/database";

class Contact extends Model<
    InferAttributes<Contact>,
    InferCreationAttributes<Contact>
> {
    declare id: CreationOptional<string>;
    declare name: string;
    declare email: string;
    declare subject: string;
    declare message: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

Contact.init(
    {
        id: {
            type: UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(120),
            allowNull: false,
            validate: { isEmail: true },
        },
        subject: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: "contacts",
        underscored: true,
        timestamps: true,
    }
);

export default Contact;
