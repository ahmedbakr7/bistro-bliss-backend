import Joi from "joi";

export type ProductQuery = {
    name?: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    limit: number;
    page: number;
    sortBy: "name" | "price" | "createdAt";
    sortOrder: "asc" | "desc";
};

const name = Joi.string().trim().length(50);

const description = Joi.string().max(255).trim();

const price = Joi.number().positive();

export const imageUrl = Joi.string().uri().trim().messages({
    "string.uri": "imageUrl must be a valid URI",
});

export const productIdParamSchema = Joi.object({
    productId: Joi.string()
        .guid({ version: ["uuidv4"] })
        .required(),
}).options({
    abortEarly: false,
});

export const createProductSchema = Joi.object({
    name: name.required(),
    description: description.required(),
    price: price.required(),
    imageUrl: imageUrl.optional(),
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});

export const updateProductSchema = Joi.object({
    name: name.optional(),
    description: description.optional(),
    price: price.optional(),
    imageUrl: imageUrl.optional(),
})
    .min(1)
    .options({
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
    });

export const productQuerySchema = Joi.object({
    name: name.optional(),
    description: description.optional(),
    imageUrl: name.optional(),
    price: name.optional(),
    limit: Joi.number().integer().positive().min(1).max(100).default(10),
    page: Joi.number().integer().positive().min(1).default(1),
    sortBy: Joi.string()
        .trim()
        .valid("name", "price", "createdAt")
        .default("createdAt"),
    sortOrder: Joi.string()
        .trim()
        .lowercase()
        .valid("asc", "desc")
        .default("asc"),
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});
