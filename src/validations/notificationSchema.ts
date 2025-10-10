import Joi from "joi";

export type NotificationType =
    | "RESERVATION_CONFIRMED"
    | "ORDER_READY"
    | "NEW_RESERVATION"
    | "NEW_ORDER"
    | "ORDER_ACCEPTED"
    | "ORDER_OUT_FOR_DELIVERY"
    | "ORDER_DELIVERED";

export type NotificationQuery = {
    page: number;
    limit: number;
    sortBy: "createdAt" | "readAt" | "type";
    sortOrder: "asc" | "desc";
    type?: NotificationType;
    userId?: string;
    unread?: boolean; // convenience filter
};

const uuidV4 = Joi.string().guid({ version: ["uuidv4"] });

export const notificationIdParamSchema = Joi.object({
    notificationId: uuidV4.required(),
}).options({ abortEarly: false });

const type = Joi.string()
    .valid(
        "RESERVATION_CONFIRMED",
        "ORDER_READY",
        "NEW_RESERVATION",
        "NEW_ORDER",
        "ORDER_ACCEPTED",
        "ORDER_OUT_FOR_DELIVERY",
        "ORDER_DELIVERED"
    )
    .messages({ any: "Invalid notification type" });

export const createNotificationSchema = Joi.object({
    userId: uuidV4.optional().allow(null),
    type: type.required(),
    message: Joi.string().trim().max(1000).required(),
}).options({ abortEarly: false, allowUnknown: false, stripUnknown: true });

export const updateNotificationSchema = Joi.object({
    message: Joi.string().trim().max(1000).optional(),
    readAt: Joi.date().iso().allow(null).optional(),
})
    .min(1)
    .options({ abortEarly: false, allowUnknown: false, stripUnknown: true });

export const notificationQuerySchema = Joi.object({
    userId: uuidV4.optional(),
    type: type.optional(),
    unread: Joi.boolean()
        .truthy("true")
        .truthy("1")
        .falsy("false")
        .falsy("0")
        .optional(),
    limit: Joi.number().integer().min(1).max(100).default(10),
    page: Joi.number().integer().positive().min(1).default(1),
    sortBy: Joi.string()
        .valid("createdAt", "readAt", "type")
        .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
}).options({ abortEarly: false, allowUnknown: false, stripUnknown: true });
