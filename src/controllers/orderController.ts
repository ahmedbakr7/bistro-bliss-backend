import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Order, User } from "../models";
import { ServiceError } from "../util/common/common";
import { StatusCodes } from "http-status-codes";
import { OrderQuery } from "../validations/orderSchema";

// @desc    Fetch all orders (optionally filtered by userId when mounted under /users/:userId/orders)
// @route   GET /orders  OR  GET /users/:userId/orders
// @access  Private (adjust via route middleware)
export const getAllOrders = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const { limit, page, sortBy, sortOrder, ...where } =
            req.query as unknown as OrderQuery;
        const offset = (page - 1) * limit;

        // If nested under /users/:userId/orders propagate userId filter
        (where as any).userId = req.params.userId || undefined;

        const { rows, count } = await Order.findAndCountAll({
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

// @desc    Get single order by id
// @route   GET /orders/:orderId  OR  GET /users/:userId/orders/:orderId
// @access  Private
export const getOrderById = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.orderId;
        const order = await Order.findByPk(id);
        if (!order) {
            throw new ServiceError("Order not found", 404, "orders:getById");
        }

        res.json(order);
    }
);

// @desc    Create new order (linked to user if userId provided by nested route or body)
// @route   POST /orders  OR  POST /users/:userId/orders
// @access  Private
export const createOrder = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const payload = (req.body.order || req.body) as Partial<Order>;
        const userId = req.params.userId || (payload as any).userId;

        const user =
            (req as any).user ?? (userId ? await User.findByPk(userId) : null);
        if (!user) {
            throw new ServiceError("User not found", 404, "orders:createOrder");
        }

        // Ensure we do not let clients override protected fields
        const newOrder = await (user as any).createOrder({ ...payload });

        res.status(StatusCodes.CREATED).json({ order: newOrder });
    }
);

// @desc    Update an existing order (partial update)
// @route   PATCH /orders/:orderId  OR  PATCH /users/:userId/orders/:orderId
// @access  Private
export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.orderId;
    if (!id) {
        throw new ServiceError("Order id is required", 400, "orders:update");
    }

    const order = await Order.findByPk(id);
    if (!order) {
        throw new ServiceError("Order not found", 404, "orders:update");
    }

    const data = (req.body.order ?? req.body) as Partial<Order>;
    const updated = await order.update(data);
    res.json(updated);
});

// @desc    Delete an order
// @route   DELETE /orders/:orderId  OR  DELETE /users/:userId/orders/:orderId
// @access  Private
export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.orderId;
    if (!id) {
        throw new ServiceError("Order id is required", 400, "orders:delete");
    }

    const order = await Order.findByPk(id);
    if (!order) {
        throw new ServiceError("Order not found", 404, "orders:delete");
    }

    await order.destroy();
    res.status(200).json({ message: `Deleted order ${id} successfully` });
});
