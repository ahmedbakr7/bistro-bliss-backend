import Joi from "joi";

const uuidV4 = Joi.string().guid({ version: ["uuidv4"] });

export const favouriteAddSchema = Joi.object({
    productId: uuidV4.required(),
}).options({ abortEarly: false, allowUnknown: false, stripUnknown: true });

export const favouriteDetailIdParamSchema = Joi.object({
    detailId: uuidV4.required(),
}).options({ abortEarly: false });
