import Joi from "joi";

const uuidV4 = Joi.string().guid({ version: ["uuidv4"] });

export const cartAddItemSchema = Joi.object({
    productId: uuidV4.required(),
    quantity: Joi.number().integer().positive().min(1).max(999).default(1),
}).options({ abortEarly: false, allowUnknown: false, stripUnknown: true });

export const cartUpdateItemSchema = Joi.object({
    quantity: Joi.number().integer().positive().min(1).max(999).required(),
}).options({ abortEarly: false, allowUnknown: false, stripUnknown: true });

export const cartDetailIdParamSchema = Joi.object({
    detailId: uuidV4.required(),
}).options({ abortEarly: false });

// New: query params for GET /cart
export const cartGetQuerySchema = Joi.object({
    includeProduct: Joi.boolean()
        .truthy("1", "true")
        .falsy("0", "false")
        .default(true),
}).options({ abortEarly: false, allowUnknown: false, stripUnknown: true });
