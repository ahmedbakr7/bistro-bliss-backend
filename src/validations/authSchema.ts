import Joi, { string } from "joi";
import { email, password } from "./userSchema";
import { Request } from "express";

const token = Joi.string().trim().length(6).required();

export const verifyEmailSchema = Joi.object({
    code: token,
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});

export const sendResetPasswordSchema = Joi.object({
    email: email.required(),
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});

export const resetPasswordSchema = Joi.object({
    newPassword: password.required(),
    token: token,
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});

export const loginSchema = Joi.object({
    email: email.required(),
    password: password.required(),
});
