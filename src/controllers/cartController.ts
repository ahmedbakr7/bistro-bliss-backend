import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Order, OrderDetails, Product } from "../models";
import { ServiceError } from "../util/common/common";
import sequelize from "../util/database";

// Ensure/get cart
async function ensureCart(userId: string) {
    return (Order as any).getOrCreateCart(userId);
}

// GET /users/:userId/cart
export const getCart = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const userId = req.params.userId as string;
        const includeProduct = ((req as any).validatedQuery.includeProduct as any) === true;
        const cart = await ensureCart(userId);
        const items = await OrderDetails.findAll({
            where: { orderId: cart.id } as any,
            ...(includeProduct && {
                include: [
                    {
                        model: Product,
                        as: "product",
                        attributes: [
                            "id",
                            "name",
                            "price",
                            "imageUrl",
                            "category",
                        ],
                    },
                ],
            }),
        });
        res.json({ cartId: cart.id, items });
    }
);

// POST /users/:userId/cart/items { productId, quantity }
export const addCartItem = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const userId = req.params.userId as string;
        const { productId, quantity } = req.body;
        if (!productId || !quantity || quantity < 1)
            throw new ServiceError(
                "productId and positive quantity required",
                400,
                "cart:add"
            );
        const product: any = await Product.findByPk(productId);
        if (!product)
            throw new ServiceError("Product not found", 404, "cart:add");
        const cart = await ensureCart(userId);
        const existing: any = await OrderDetails.findOne({
            where: { orderId: cart.id, productId } as any,
        });
        if (existing) {
            await existing.update({ quantity: existing.quantity + quantity });
            res.status(200).json(existing);
            return;
        }
        const line = await OrderDetails.create({
            orderId: cart.id,
            productId: product.id,
            quantity,
            name_snapshot: product.name,
            price_snapshot: product.price,
        } as any);
        res.status(201).json(line);
    }
);

// PATCH /users/:userId/cart/items/:detailId { quantity }
export const updateCartItem = asyncHandler(
    async (req: Request, res: Response) => {
        const { detailId } = req.params as any;
        const { quantity } = req.body;
        if (quantity === undefined || quantity < 1)
            throw new ServiceError(
                "positive quantity required",
                400,
                "cart:update"
            );
        const line = await OrderDetails.findByPk(detailId);
        if (!line)
            throw new ServiceError("Cart item not found", 404, "cart:update");
        await line.update({ quantity });
        res.json(line);
    }
);

// DELETE /users/:userId/cart/items/:detailId
export const removeCartItem = asyncHandler(
    async (req: Request, res: Response) => {
        const { detailId } = req.params as any;
        const line = await OrderDetails.findByPk(detailId);
        if (!line)
            throw new ServiceError("Cart item not found", 404, "cart:remove");
        await line.destroy();
        res.status(204).end();
    }
);

// POST /users/:userId/cart/checkout
export const checkoutCart = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const userId = req.params.userId as string;
        const cart = await ensureCart(userId);
        const items: any[] = await OrderDetails.findAll({
            where: { orderId: cart.id } as any,
        });
        if (!items.length)
            throw new ServiceError("Cart empty", 400, "cart:checkout");
        const total = items.reduce(
            (s, i) => s + Number(i.price_snapshot) * Number(i.quantity),
            0
        );
        await cart.update({ status: "CREATED", totalPrice: total });
        res.status(201).json({ orderId: cart.id, total });
    }
);

// DELETE /users/:userId/cart (clear all items)
export const clearCart = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const userId = req.params.userId as string;
        const cart: any = await ensureCart(userId);
        if (!cart) throw new ServiceError("Cart not found", 404, "cart:clear");
        if (cart.status !== "DRAFT") {
            throw new ServiceError(
                "Cart is no longer editable",
                409,
                "cart:clear"
            );
        }
        await OrderDetails.destroy({ where: { orderId: cart.id } as any });
        res.status(200).json({ items: [] });
    }
);
