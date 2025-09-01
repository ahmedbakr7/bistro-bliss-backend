import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Category } from "../models";
import { ServiceError } from "../util/common/common";
import { StatusCodes } from "http-status-codes";
import { CategoryQuery } from "../validations/categorySchema";

// GET /categories
export const getAllCategories = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const { limit, page, sortBy, sortOrder, ...where } =
            req.query as unknown as CategoryQuery;
        const offset = (page - 1) * limit;

        const { rows, count } = await Category.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortBy, sortOrder]],
        });

        res.json({
            data: rows,
            pagination: {
                limit,
                page,
                count,
                pages: Math.ceil(count / limit),
            },
        });
    }
);

// GET /categories/:categoryId
export const getCategoryById = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.categoryId;
        const category = await Category.findByPk(id);
        if (!category) {
            throw new ServiceError(
                "Category not found",
                404,
                "categories:getById"
            );
        }
        res.json(category);
    }
);

// POST /categories
export const createCategory = asyncHandler(
    async (req: Request, res: Response) => {
        const payload = req.body.category || req.body;
        const category = await Category.create(payload);
        res.status(StatusCodes.CREATED).json({ category });
    }
);

// PATCH /categories/:categoryId
export const updateCategory = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.categoryId;
        if (!id) {
            throw new ServiceError(
                "Category id is required",
                400,
                "categories:update"
            );
        }

        const category = await Category.findByPk(id);
        if (!category) {
            throw new ServiceError(
                "Category not found",
                404,
                "categories:update"
            );
        }

        const data = req.body.category ?? req.body;
        const updated = await category.update(data);
        res.json(updated);
    }
);

// DELETE /categories/:categoryId
export const deleteCategory = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.categoryId;
        if (!id) {
            throw new ServiceError(
                "Category id is required",
                400,
                "categories:delete"
            );
        }

        const category = await Category.findByPk(id);
        if (!category) {
            throw new ServiceError(
                "Category not found",
                404,
                "categories:delete"
            );
        }

        await category.destroy();
        res.status(200).json({
            message: `Deleted category ${id} successfully`,
        });
    }
);
