import Joi from "joi";

export type CategoryQuery = {
    page: number;
    limit: number;
    sortBy: "name" | "createdAt" | "updatedAt";
    sortOrder: "asc" | "desc";
    name?: string;
    description?: string;
};

// Reusable field validators
export const categoryId = Joi.string()
    .guid({ version: ["uuidv4"] })
    .messages({ "string.guid": "Invalid category id; expected UUID v4" });

export const name = Joi.string().trim().min(2).max(50).messages({
    "string.min": "name must be at least {#limit} characters",
    "string.max": "name must be at most {#limit} characters",
});

export const description = Joi.string().trim().max(255).messages({
    "string.max": "description must be at most {#limit} characters",
});

export const imageUrl = Joi.string().uri().trim().messages({
    "string.uri": "imageUrl must be a valid URI",
});

// Schemas
export const createCategorySchema = Joi.object({
    name: name.required(),
    description: description.required(),
    imageUrl: imageUrl.optional().allow(null, ""),
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});

export const updateCategorySchema = Joi.object({
    name: name.optional(),
    description: description.optional(),
    imageUrl: imageUrl.optional().allow(null, ""),
})
    .min(1)
    .options({
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
    });

export const categoryIdParamSchema = Joi.object({
    categoryId: categoryId.required(),
}).options({ abortEarly: false });

export const categoryQuerySchema = Joi.object({
    limit: Joi.number().integer().positive().min(1).max(100).default(10),
    page: Joi.number().integer().positive().min(1).default(1),
    sortBy: Joi.string()
        .valid("name", "createdAt", "updatedAt")
        .default("createdAt"),
    sortOrder: Joi.string()
        .trim()
        .lowercase()
        .valid("asc", "desc")
        .default("asc"),
    name: name.optional(),
    description: description.optional(),
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});
