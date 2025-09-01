import Joi from "joi";

// Booking specific types
export type BookingQuery = {
    page: number;
    limit: number;
    sortBy: "bookedAt" | "createdAt" | "status" | "numberOfPeople";
    sortOrder: "asc" | "desc";
    status?: BookingStatus;
    userId?: string; // optional filter
    numberOfPeople?: number; // exact match filter
};

export type BookingStatus =
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED_BY_CUSTOMER"
    | "CANCELLED_BY_RESTAURANT"
    | "NO_SHOW"
    | "SEATED"
    | "COMPLETED";

// Reusable booking field validators
export const bookingId = Joi.string()
    .guid({ version: ["uuidv4"] })
    .messages({ "string.guid": "Invalid booking id; expected UUID v4" });

export const userId = Joi.string()
    .guid({ version: ["uuidv4"] })
    .messages({ "string.guid": "Invalid user id; expected UUID v4" });

export const numberOfPeople = Joi.number().integer().min(1).max(100).messages({
    "number.base": "numberOfPeople must be a number",
    "number.min": "numberOfPeople must be at least {#limit}",
    "number.max": "numberOfPeople must be at most {#limit}",
    "number.integer": "numberOfPeople must be an integer",
});

export const bookedAt = Joi.date().iso().messages({
    "date.base": "bookedAt must be a valid date",
    "date.format": "bookedAt must be an ISO date string",
});

export const status = Joi.string()
    .valid(
        "PENDING",
        "CONFIRMED",
        "CANCELLED_BY_CUSTOMER",
        "CANCELLED_BY_RESTAURANT",
        "NO_SHOW",
        "SEATED",
        "COMPLETED"
    )
    .messages({
        "any.only":
            "status must be one of PENDING, CONFIRMED, CANCELLED_BY_CUSTOMER, CANCELLED_BY_RESTAURANT, NO_SHOW, SEATED, COMPLETED",
    });

// Schemas
export const createBookingSchema = Joi.object({
    userId: userId.required(),
    numberOfPeople: numberOfPeople.default(1).optional(),
    bookedAt: bookedAt.required(),
    status: status.optional(), // default handled by model (PENDING)
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});

export const updateBookingSchema = Joi.object({
    numberOfPeople: numberOfPeople.optional(),
    bookedAt: bookedAt.optional(),
    status: status.optional(),
})
    .min(1)
    .options({
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
    });

export const bookingIdParamSchema = Joi.object({
    bookingId: bookingId.required(),
}).options({ abortEarly: false });

export const BookingQuerySchema = Joi.object({
    limit: Joi.number().integer().positive().min(1).max(100).default(10),
    page: Joi.number().integer().positive().min(1).default(1),
    sortBy: Joi.string()
        .valid("bookedAt", "createdAt", "status", "numberOfPeople")
        .default("bookedAt"),
    sortOrder: Joi.string()
        .trim()
        .lowercase()
        .valid("asc", "desc")
        .default("desc"),
    status: status.optional(),
    userId: userId.optional(),
    numberOfPeople: numberOfPeople.optional(),
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});
