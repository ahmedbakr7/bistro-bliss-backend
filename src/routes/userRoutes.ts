import { Router } from "express";
import {
    createUser,
    deleteUser,
    fileDownload,
    fileUpload,
    getAllUsers,
    getUserById,
    updateUserPatch,
} from "../controllers/userController";
import buildValidator from "../middlewares/validation";
import {
    createUserSchema,
    userIdParamSchema,
    updateUserSchema,
    userListQuerySchema,
} from "../validations/userSchema";
import { verifyJWT } from "../middlewares/verifyJWT";
import uploader, { makeUploader } from "../middlewares/multer"; // new factory
import productRouter from "./productRoutes";
import orderRouter from "./orderRoutes";
import bookingRouter from "./bookingRoutes";
import isOwnerOrAdmin from "../middlewares/isOwnerOrAdmin";
import { loadUserByParam } from "../middlewares/loadUser";
import cartRouter from "./cartRoutes";
import favouritesRouter from "./favouritesRoutes";
import notificationRouter from "./notificationRoutes";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: List of users
 *       400:
 *         description: Validation error
 *   post:
 *     summary: Create a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       201:
 *         description: Created user
 *       400:
 *         description: Validation error
 */
router
    .route("/")
    .get(buildValidator({ query: userListQuerySchema }), getAllUsers)
    .post(buildValidator({ body: createUserSchema }), createUser);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: { description: User found }
 *       404: { description: User not found }
 *   patch:
 *     summary: Update user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *     responses:
 *       200: { description: Updated user }
 *       401: { description: Unauthorized }
 *       404: { description: User not found }
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: { description: User deleted }
 *       401: { description: Unauthorized }
 *       404: { description: User not found }
 */
router
    .route("/:userId")
    // .all(buildValidator({ params: userIdParamSchema }))
    .get(buildValidator({ params: userIdParamSchema }), getUserById)
    .patch(
        buildValidator({ params: userIdParamSchema }),
        verifyJWT,
        isOwnerOrAdmin,
        buildValidator({ body: updateUserSchema }),
        updateUserPatch
    )
    .delete(verifyJWT, isOwnerOrAdmin, deleteUser);

/**
 * @swagger
 * /users/{userId}/upload:
 *   post:
 *     summary: Upload user image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Image uploaded }
 */
router.post(
    "/:userId/upload",
    buildValidator({ params: userIdParamSchema }),
    verifyJWT,
    isOwnerOrAdmin,
    // Use specific uploader instance (could customize limits if desired)
    makeUploader({
        folder: "users",
        fieldName: "image",
        maxFileSizeMB: 2,
        required: true,
    }),
    fileUpload
);

/**
 * @swagger
 * /users/{userId}/download:
 *   get:
 *     summary: Download user image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: { description: Image file }
 */
router
    .route("/:userId/download")
    .get(
        buildValidator({ params: userIdParamSchema }),
        verifyJWT,
        isOwnerOrAdmin,
        fileDownload
    );

// nested routes
// router.use(
//     "/:userId/products",
//     buildValidator({ params: userIdParamSchema }),
//     loadUserByParam,
//     productRouter
// );
router.use(
    "/:userId/orders",
    buildValidator({ params: userIdParamSchema }),
    loadUserByParam,
    orderRouter
);
router.use(
    "/:userId/bookings",
    buildValidator({ params: userIdParamSchema }),
    loadUserByParam,
    bookingRouter
);
router.use(
    "/:userId/cart",
    buildValidator({ params: userIdParamSchema }),
    loadUserByParam,
    cartRouter
);
router.use(
    "/:userId/favourites",
    buildValidator({ params: userIdParamSchema }),
    loadUserByParam,
    favouritesRouter
);
router.use(
    "/:userId/notifications",
    buildValidator({ params: userIdParamSchema }),
    loadUserByParam,
    notificationRouter
);

export default router;
