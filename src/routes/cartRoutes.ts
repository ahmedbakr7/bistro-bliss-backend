import { Router } from "express";
import { verifyJWT } from "../middlewares/verifyJWT";
import isOwnerOrAdmin from "../middlewares/isOwnerOrAdmin";
import buildValidator from "../middlewares/validation";
import {
    cartAddItemSchema,
    cartUpdateItemSchema,
    cartDetailIdParamSchema,
    cartGetQuerySchema,
} from "../validations/cartSchema";
import {
    getCart,
    addCartItem,
    updateCartItem,
    removeCartItem,
    checkoutCart,
    clearCart,
} from "../controllers/cartController";

const router = Router({ mergeParams: true });

router.get(
    "/",
    verifyJWT,
    isOwnerOrAdmin,
    buildValidator({ query: cartGetQuerySchema }),
    getCart
);
router.delete("/", verifyJWT, isOwnerOrAdmin, clearCart);
router.post(
    "/items",
    verifyJWT,
    isOwnerOrAdmin,
    buildValidator({ body: cartAddItemSchema }),
    addCartItem
);
router.patch(
    "/items/:detailId",
    verifyJWT,
    isOwnerOrAdmin,
    buildValidator({
        params: cartDetailIdParamSchema,
        body: cartUpdateItemSchema,
    }),
    updateCartItem
);
router.delete(
    "/items/:detailId",
    verifyJWT,
    isOwnerOrAdmin,
    buildValidator({ params: cartDetailIdParamSchema }),
    removeCartItem
);
router.post("/checkout", verifyJWT, isOwnerOrAdmin, checkoutCart);

export default router;
