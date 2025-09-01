import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { ServiceError } from "../util/common/common";
import { STATUS_CODES } from "http";

const validationOptions: Joi.ValidationOptions = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
};

export default function buildValidator(schemas: {
    body?: Joi.ObjectSchema<any>;
    params?: Joi.ObjectSchema<any>;
    query?: Joi.ObjectSchema<any>;
}) {
    return (req: Request, res: Response, next: NextFunction) => {
        const formatError = (err: Joi.ValidationError) =>
            err.details.map((d) => d.message.replace(/"/g, ""))?.join("; ");
        try {
            // Params
            if (schemas.params) {
                const { value, error } = schemas.params.validate(
                    req.params ?? {},
                    validationOptions
                );
                if (error) {
                    throw new ServiceError(
                        formatError(error),
                        400,
                        "validation:params"
                    );
                }
                req.params = value;
            }

            // Query (cannot reassign req.query in Express 5, mutate instead)
            if (schemas.query) {
                const { value, error } = schemas.query.validate(
                    req.query ?? {},
                    validationOptions
                );
                if (error) {
                    throw new ServiceError(
                        formatError(error),
                        400,
                        "validation:query"
                    );
                }
                // Clear existing keys then copy validated ones
                const current: any = req.query as any;
                Object.keys(current).forEach((k) => delete current[k]);
                Object.assign(current, value);
                // Optional: expose unified validated container
                (req as any).validatedQuery = value;
            }

            // Body
            if (schemas.body) {
                const { value, error } = schemas.body.validate(
                    req.body ?? {},
                    validationOptions
                );
                if (error) {
                    throw new ServiceError(
                        formatError(error),
                        400,
                        "validation:body"
                    );
                }
                req.body = value;
            }

            return next();
        } catch (err) {
            return next(err);
        }
    };
}
