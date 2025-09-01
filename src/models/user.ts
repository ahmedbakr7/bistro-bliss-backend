import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    STRING,
    UUID,
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
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import { ServiceError } from "../util/common/common";
import Booking from "./booking";

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<string>;
    declare name: string;
    declare email: string;

    declare password: CreationOptional<string | null>; // added so TS knows about the virtual attribute
    declare passwordHash: CreationOptional<string>; // stored hashed password

    declare phoneNumber: string;
    declare imageUrl: CreationOptional<string | null>;
    declare role: CreationOptional<string>;
    declare createdAt: CreationOptional<Date>;
    declare deletedAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    // Since TS cannot determine model association at compile time
    // we have to declare them here purely virtually
    // these will not exist until `Model.init` was called.
    declare getBookings: HasManyGetAssociationsMixin<Booking>; // Note the null assertions!
    declare addBooking: HasManyAddAssociationMixin<Booking, number>;
    declare addBookings: HasManyAddAssociationsMixin<Booking, number>;
    declare setBookings: HasManySetAssociationsMixin<Booking, number>;
    declare removeBooking: HasManyRemoveAssociationMixin<Booking, number>;
    declare removeBookings: HasManyRemoveAssociationsMixin<Booking, number>;
    declare hasBooking: HasManyHasAssociationMixin<Booking, number>;
    declare hasBookings: HasManyHasAssociationsMixin<Booking, number>;
    declare countBookings: HasManyCountAssociationsMixin;
    declare createBooking: HasManyCreateAssociationMixin<Booking,"userId">;

//   declare projects?: NonAttribute<Project[]>; // Note this is optional since it's only populated when explicitly requested in code
//   declare static associations: {
//     projects: Association<User, Project>;
//   };

    // Instance method to verify a plain password against the stored hash
    async checkPassword(plain: string): Promise<boolean> {
        return bcrypt.compare(plain, this.passwordHash);
    }

    // public toJSON(): object | T {
    //     return {}
    // }
}

User.init(
    {
        id: {
            type: UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.CHAR(50),
            allowNull: false,
        },
        email: {
            type: STRING(50),
            unique: true,
            allowNull: false,
        },
        // Virtual field accepts the plain text password, hashes it, and stores the hash in passwordHash
        password: {
            type: DataTypes.VIRTUAL,
            set(value: string) {
                (this as any).setDataValue("password", value);
                const hash = bcrypt.hashSync(value, 10);
                this.setDataValue("passwordHash", hash);
            },
        },
        // Persisted column for the hash
        passwordHash: {
            type: DataTypes.STRING, // 60 chars fits bcrypt hashes
            allowNull: false,
        },
        phoneNumber: {
            type: STRING(50),
            unique: true,
            allowNull: false,
        },
        imageUrl: {
            type: STRING,
            set(imageUrl_: string) {
                const old = this.getDataValue("imageUrl");
                // Persist new value immediately
                this.setDataValue("imageUrl", imageUrl_);
                // If there was an old different image, attempt deletion (non-blocking)
                if (old && old !== imageUrl_) {
                    const target = path.join(process.cwd(), "uploads", old);
                    fs.unlink(target, (err) => {
                        if (err && (err as any).code !== "ENOENT") {
                            console.error(
                                `Failed to delete old image '${old}':`,
                                err
                            );
                        }
                    });
                }
            },
        },
        role: {
            type: DataTypes.ENUM("user", "admin"),
            defaultValue: "user",
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
        deletedAt: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: "users",
        underscored: true,
        paranoid: true,
        timestamps: true,
        defaultScope: {
            attributes: { exclude: ["passwordHash"] },
        },
        scopes: {
            withPassword: { attributes: { include: ["passwordHash"] } },
        },
    }
);

export default User;
