import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Order, OrderDetails, Product } from "../models";
import { ServiceError } from "../util/common/common";

async function ensureFavourites(userId: string) {
    return (Order as any).getOrCreateFavourites(userId);
}

// GET /users/:userId/favourites
export const getFavourites = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const userId = req.params.userId as string;
        const fav = await ensureFavourites(userId);
        // Load order detail lines with their associated product
        const lines: any[] = await OrderDetails.findAll({
            where: { orderId: fav.id } as any,
            include: [{ model: Product, as: "product" }],
        });
        // Map to products (include favouriteDetailId so client can still remove)
        const products = lines
            .filter((l) => l.product)
            .map((l) => ({
                favouriteDetailId: l.id,
                ...l.product.get(),
            }));
        res.json({ favouritesId: fav.id, products });
    }
);

// POST /users/:userId/favourites { productId }
export const addFavourite = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const userId = req.params.userId as string;
        const { productId } = req.body;
        if (!productId)
            throw new ServiceError("productId required", 400, "fav:add");

        const product: any = await Product.findByPk(productId);
        if (!product)
            throw new ServiceError("Product not found", 404, "fav:add");

        const fav = await ensureFavourites(userId);
        const existing: any = await OrderDetails.findOne({
            where: { orderId: fav.id, productId } as any,
        });

        if (existing) {
            // Return the product representation instead of the order detail
            res.status(200).json({
                favouriteDetailId: existing.id,
                ...product.get(),
            });
            return;
        }

        const line = await OrderDetails.create({
            orderId: fav.id,
            productId: product.id,
            quantity: 1,
            name_snapshot: product.name,
            price_snapshot: product.price,
        } as any);

        res.status(201).json({
            favouriteDetailId: line.id,
            ...product.get(),
        });
    }
);

// DELETE /users/:userId/favourites/:detailId
export const removeFavourite = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const { detailId } = req.params as any;
        const line = await OrderDetails.findByPk(detailId);
        if (!line)
            throw new ServiceError("Favourite not found", 404, "fav:remove");
        await line.destroy();
        res.status(204).end();
    }
);
