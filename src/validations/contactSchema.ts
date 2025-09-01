import Joi from "joi";

// Booking specific types
export type BookingQuery = {
    page: number;
    limit: number;
    sortBy: "bookedAt" | "createdAt" | "status" | "numberOfPeople";
    sortOrder: "asc" | "desc";
    name?: string;
    email?: string; // optional filter
};

export const string_ = Joi.string().trim()

export const createContactSchema = Joi.object({
    name: Joi.string().max(100).required(),
    email: Joi.string().email().max(120).required(),
    subject: Joi.string().max(150).required(),
    message: Joi.string().max(5000).required(),
});

export const contactListQuerySchema = Joi.object({
    page: Joi.number().integer().positive().default(1),
    limit: Joi.number().integer().positive().max(100).default(10),
    sortBy: Joi.string()
        .valid("createdAt", "name", "email")
        .default("createdAt"),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
});

const contactId = Joi.string()
    .guid({ version: ["uuidv4"] })
    .messages({ "string.guid": "Invalid booking id; expected UUID v4" });

export const contactIdParamSchema = Joi.object({
    contactId: contactId.required(),
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
    name: string_.max(100).optional(),
    email: string_.max(120).optional()
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});
