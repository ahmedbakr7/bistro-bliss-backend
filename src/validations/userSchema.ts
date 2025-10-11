import Joi from "joi";

export type UserQuery = {
    page: number;
    limit: number;
    sortBy: "name" | "email" | "createdAt";
    sortOrder: "asc" | "desc";
    role?: string;
    email?: string;
    phoneNumber?: string;
    imageUrl?: string;
    // replaced `name` with `search` to support searching by name or email
    search?: string;
};

// reusable pieces
export const name = Joi.string().trim().min(2).max(50).lowercase().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least {#limit} characters",
    "string.max": "Name must be at most {#limit} characters",
});

export const email = Joi.string().trim().email().lowercase().max(50).messages({
    "string.email": "Email must be a valid email address",
    "string.max": "Email must be at most {#limit} characters",
});

// new: generic search term to match names or emails containing the value
export const search = Joi.string().trim().min(1).max(50).messages({
    "string.base": "Search must be a string",
    "string.min": "Search must be at least {#limit} character",
    "string.max": "Search must be at most {#limit} characters",
});

// password policy (example: min 8, max 30, at least one upper, lower, digit, special)
export const password = Joi.string()
    .min(8)
    .max(30)
    .trim()
    .pattern(
        new RegExp("(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#\\$%\\^&\\*])")
    )
    .messages({
        "string.min": "Password must be at least {#limit} characters",
        "string.max": "Password must be at most {#limit} characters",
        "string.pattern.base":
            "Password must contain upper and lower case letters, a digit and a special character",
    });

export const phoneNumber = Joi.string()
    .trim()
    .max(50)
    .pattern(/^[+\d][\d\s\-\(\)]{6,49}$/)
    .messages({
        "string.pattern.base":
            "Phone number must contain digits and may include +, spaces, dashes or parentheses",
        "string.max": "Phone number must be at most {#limit} characters",
    });

export const imageUrl = Joi.string().uri().trim().messages({
    "string.uri": "imageUrl must be a valid URI",
});

export const role = Joi.string().valid("user", "admin").messages({
    "any.only": "Role must be either 'user' or 'admin'",
});
// Schemas

// For creating (register). password required.
export const createUserSchema = Joi.object({
    name: name.required(),
    email: email.required(),
    password: password.required(), // virtual field — client sends plain password
    phoneNumber: phoneNumber.required(),
    imageUrl: imageUrl.optional().allow(null, ""),
    role: role.optional(), // usually let DB default to "user"
}).options({
    abortEarly: false,
    allowUnknown: false, // reject unknown keys (good for security)
    stripUnknown: true,
});

// For login
export const loginSchema = Joi.object({
    email: email.required(),
    password: Joi.string().required().messages({
        "string.empty": "Password is required",
    }),
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});

export const updateUserSchema = Joi.object({
    name: name.optional(),
    email: email.optional(),
    password: password.optional(), // virtual field; when set, model will hash into passwordHash
    phoneNumber: phoneNumber.optional(),
    imageUrl: imageUrl.optional().allow(null, ""),
    role: role.optional(),
})
    .min(1)
    .options({
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
    });

// Generic param schema: pass one or more param names that should be validated as UUID v4
export const userIdParamSchema = Joi.object({
    userId: Joi.string()
        .guid({ version: ["uuidv4"] })
        .required(),
}).options({
    abortEarly: false,
});

export const userListQuerySchema = Joi.object({
    limit: Joi.number().integer().positive().min(1).max(100).default(10),
    page: Joi.number().integer().positive().min(1).default(1),
    sortBy: Joi.string()
        .valid("name", "email", "createdAt")
        .default("createdAt"),
    sortOrder: Joi.string()
        .trim()
        .lowercase()
        .valid("asc", "desc")
        .default("desc"),
    role: role.optional(),
    email: email.optional(),
    phoneNumber: phoneNumber.optional(),
    imageUrl: imageUrl.optional(),
    // replaced `name` filter with a generic `search` term
    search: search.optional(),
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});
