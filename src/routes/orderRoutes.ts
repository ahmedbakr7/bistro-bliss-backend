import { Router } from "express";
import productRouter from "./productRoutes";
import buildValidator from "../middlewares/validation";
import isOwnerOrAdmin from "../middlewares/isOwnerOrAdmin";
import { verifyJWT } from "../middlewares/verifyJWT";
import {
    createOrderSchema,
    orderIdParamSchema,
    orderQuerySchema,
    updateOrderSchema,
} from "../validations/orderSchema";
import {
    createOrder,
    deleteOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
} from "../controllers/orderController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [status, totalPrice, createdAt, acceptedAt, deliveredAt, receivedAt], default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of orders }
 *   post:
 *     summary: Create an order
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderInput'
 *     responses:
 *       201: { description: Created order }
 */
router
    .route("/")
    .get(buildValidator({ query: orderQuerySchema }), getAllOrders)
    .post(verifyJWT, buildValidator({ query: createOrderSchema }), createOrder);

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Order found }
 *       404: { description: Order not found }
 *   patch:
 *     summary: Update order
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderInput'
 *     responses:
 *       200: { description: Updated order }
 *   delete:
 *     summary: Delete order
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted order }
 */
router
    .route("/:orderId")
    .all(buildValidator({ params: orderIdParamSchema }))
    .get(getOrderById)
    .patch(
        verifyJWT,
        isOwnerOrAdmin,
        buildValidator({ body: updateOrderSchema }),
        updateOrder
    )
    .delete(verifyJWT, isOwnerOrAdmin, deleteOrder);

// nested products under order (if applicable)
router.use("/:orderId/products", productRouter);

export default router;
