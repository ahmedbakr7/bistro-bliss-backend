import Joi from "joi";
import { OrderStatus } from "../models/order";

export type OrderQuery = {
    status?: OrderStatus;
    userId?: string;
    limit: number;
    page: number;
    sortBy:
        | "status"
        | "totalPrice"
        | "createdAt"
        | "acceptedAt"
        | "deliveredAt"
        | "receivedAt";
    sortOrder: "asc" | "desc";
    includeOrderDetails?: boolean;
};

export type OrderIncludeQuery = {
    includeOrderDetails: boolean;
};

const status = Joi.string()
    .trim()
    .uppercase()
    .valid(
        "CANCELED",
        "DRAFT",
        "CREATED",
        "PREPARING",
        "READY",
        "DELIVERING",
        "RECEIVED"
    )

const date = Joi.date().iso();

const uuidV4 = Joi.string().guid({ version: ["uuidv4"] });

export const orderIdParamSchema = Joi.object({
    orderId: uuidV4.required(),
}).options({
    abortEarly: false,
});

export const createOrderSchema = Joi.object({
    status: status,
    userId: uuidV4.optional().default(null),
    totalPrice: Joi.number().positive().precision(2).optional(), // if client supplies, else compute server-side
    acceptedAt: date.optional().default(null),
    deliveredAt: date.optional().default(null),
    receivedAt: date.optional().default(null),
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});

export const updateOrderSchema = Joi.object({
    status: status.optional(),
    userId: uuidV4.optional().allow(null),
    totalPrice: Joi.number().positive().precision(2).optional(),
    acceptedAt: date.optional().allow(null),
    deliveredAt: date.optional().allow(null),
    receivedAt: date.optional().allow(null),
})
    .min(1)
    .options({
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
    });

const includeOrderDetails = Joi.boolean()
    .truthy("true")
    .truthy("1")
    .falsy("false")
    .falsy("0")
    .default(true);

export const orderQuerySchema = Joi.object({
    status: status.optional(),
    userId: uuidV4.optional(),
    limit: Joi.number().integer().positive().min(1).max(100).default(10),
    page: Joi.number().integer().positive().min(1).default(1),
    sortBy: Joi.string()
        .trim()
        .valid(
            "status",
            "totalPrice",
            "createdAt",
            "acceptedAt",
            "deliveredAt",
            "receivedAt"
        )
        .default("createdAt"),
    sortOrder: Joi.string()
        .trim()
        .lowercase()
        .valid("asc", "desc")
        .default("asc"),
    includeOrderDetails,
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});

export const orderIncludeQuerySchema = Joi.object({
    includeOrderDetails,
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});
