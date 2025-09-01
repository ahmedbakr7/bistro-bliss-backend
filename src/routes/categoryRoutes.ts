import { Router } from "express";
import buildValidator from "../middlewares/validation";
import { verifyJWT } from "../middlewares/verifyJWT";
import isOwnerOrAdmin from "../middlewares/isOwnerOrAdmin"; // if only admins should manage categories
import {
    categoryIdParamSchema,
    categoryQuerySchema,
    createCategorySchema,
    updateCategorySchema,
} from "../validations/categorySchema";
import {
    createCategory,
    deleteCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
} from "../controllers/categoryController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt, enum: [name, createdAt, updatedAt] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, default: asc, enum: [asc, desc] }
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *       - in: query
 *         name: description
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of categories }
 *   post:
 *     summary: Create a category
 *     security:
 *       - bearerAuth: []
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryInput'
 *     responses:
 *       201: { description: Created category }
 */
router
    .route("/")
    .get(buildValidator({ query: categoryQuerySchema }), getAllCategories)
    .post(
        verifyJWT,
        isOwnerOrAdmin,
        buildValidator({ body: createCategorySchema }),
        createCategory
    );

/**
 * @swagger
 * /categories/{categoryId}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Category found }
 *       404: { description: Category not found }
 *   patch:
 *     summary: Update category
 *     security:
 *       - bearerAuth: []
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryInput'
 *     responses:
 *       200: { description: Updated category }
 *   delete:
 *     summary: Delete category
 *     security:
 *       - bearerAuth: []
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted category }
 */
router
    .route("/:categoryId")
    .all(buildValidator({ params: categoryIdParamSchema }))
    .get(getCategoryById)
    .patch(
        verifyJWT,
        isOwnerOrAdmin,
        buildValidator({ body: updateCategorySchema }),
        updateCategory
    )
    .delete(verifyJWT, isOwnerOrAdmin, deleteCategory);

export default router;
