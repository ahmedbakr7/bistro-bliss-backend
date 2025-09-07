import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Product, User } from "../models";
import { ServiceError } from "../util/common/common";
import { StatusCodes } from "http-status-codes";
import { ProductQuery } from "../validations/productSchema";

export const getAllProducts = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { limit, page, sortBy, sortOrder, ...where } = (req as any)
            .validatedQuery as unknown as ProductQuery;
        const offset = (page - 1) * limit;

        // (where as any).userId = req.params.userId || undefined;

        const { rows, count } = await Product.findAndCountAll({
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

// @desc    Fetch a single user by ID
// @route   GET /users/:id
// @access  Private
export const getProductById = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.productId;
        const product = await Product.findByPk(id);
        if (!product) {
            throw new ServiceError(
                "Product not found",
                404,
                "products:getById"
            );
        }
        res.json(product);
    }
);

export const createProduct = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const product = req.body.product || req.body;
        const userId = req.params.userId || product.userId;

        const user = (req as any).user ?? (await User.findByPk(userId));
        if (!user) {
            throw new ServiceError(
                "User not found",
                404,
                "product:createProduct"
            );
        }

        const newProduct = await user.createProduct(product);
        res.status(StatusCodes.CREATED).json({ product: newProduct });
        return;
    }
);

// @desc    Update an existing user
// @route   PUT /users/:id
// @access  Private
export const updateProduct = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.productId;
        if (!id) {
            throw new ServiceError(
                "Product id is required",
                400,
                "products:update"
            );
        }

        const product = await Product.findByPk(id);
        if (!product) {
            throw new ServiceError("product not found", 404, "products:update");
        }

        const data = req.body.product ?? req.body; // allow either structure
        const updated = await product.update(data);
        res.json(updated);
    }
);

// @desc    Delete a user
// @route   DELETE /users/:id
// @access  Private
export const deleteProduct = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.productId;
        if (!id) {
            throw new ServiceError(
                "Product id is required",
                400,
                "products:delete"
            );
        }

        const deletedCount = await Product.destroy({ where: { id } });
        if (!deletedCount) {
            throw new ServiceError("Product not found", 404, "products:delete");
        }
        res.status(200).json({ message: `Deleted product ${id} successfully` });
    }
);
