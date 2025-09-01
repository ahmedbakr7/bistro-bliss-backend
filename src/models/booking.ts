import {
    CreationOptional,
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
    Model,
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
    UUID,
} from "sequelize";
import sequelize from "../util/database";
import User from "./user";

type BookingStatus =
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED_BY_CUSTOMER"
    | "CANCELLED_BY_RESTAURANT"
    | "NO_SHOW"
    | "SEATED"
    | "COMPLETED";

class Booking extends Model<
    InferAttributes<Booking>,
    InferCreationAttributes<Booking>
> {
    declare id: CreationOptional<string>;

    declare userId: ForeignKey<User["id"]>;
    declare user?: NonAttribute<User>; // eager loading user

    declare numberOfPeople: number;
    declare bookedAt: Date;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare status: BookingStatus;
}

Booking.init(
    {
        id: {
            type: UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        status: {
            type: DataTypes.ENUM(
                "PENDING",
                "CONFIRMED",
                "CANCELLED_BY_CUSTOMER",
                "CANCELLED_BY_RESTAURANT",
                "NO_SHOW",
                "SEATED",
                "COMPLETED"
            ),
            defaultValue: "PENDING",
            allowNull: false,
        },
        numberOfPeople: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 1,
            allowNull: false,
        },
        bookedAt: DataTypes.DATE,
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: "bookings",
        underscored: true,
        paranoid: true,
        timestamps: true,
    }
);

export default Booking;
