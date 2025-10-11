import { Router } from "express";
import {
    createProduct,
    deleteProduct,
    getAllProducts,
    getProductById,
    updateProduct,
} from "../controllers/ProductController";
import buildValidator from "../middlewares/validation";
import {
    createProductSchema,
    productIdParamSchema,
    productQuerySchema,
    updateProductSchema,
} from "../validations/productSchema";
import { verifyJWT } from "../middlewares/verifyJWT";
import { userIdParamSchema } from "../validations/userSchema";
import { cache } from "../middlewares/cache";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [name, price, createdAt], default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *       - in: query
 *         name: description
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of products }
 *   post:
 *     summary: Create a product
 *     security:
 *       - bearerAuth: []
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductInput'
 *     responses:
 *       201: { description: Created product }
 */
router
    .route("/")
    .get(
        // cache((req) => `products:${JSON.stringify(req.query)}`, 30),
        buildValidator({ query: productQuerySchema }),
        getAllProducts
    )
    .post(
        buildValidator({ body: createProductSchema }),
        verifyJWT,
        createProduct
    );

/**
 * @swagger
 * /products/{productId}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Product found }
 *       404: { description: Product not found }
 *   post:
 *     summary: Update product
 *     description: Updates product (note: should ideally be PATCH)
 *     security:
 *       - bearerAuth: []
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductInput'
 *     responses:
 *       200: { description: Updated product }
 *   delete:
 *     summary: Delete product
 *     security:
 *       - bearerAuth: []
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted product }
 */
router
    .route("/:productId")
    .get(
        cache((req) => `product:${req.params.productId}`, 120),
        buildValidator({ params: productIdParamSchema }),
        getProductById
    )
    .post(
        // verifyJWT,
        buildValidator({
            params: productIdParamSchema,
            body: updateProductSchema,
        }),
        updateProduct
    )
    .delete(
        // verifyJWT,
        buildValidator({ params: productIdParamSchema }),
        deleteProduct
    );

export default router;
