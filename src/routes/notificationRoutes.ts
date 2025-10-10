import { Router } from "express";
import buildValidator from "../middlewares/validation";
import { verifyJWT } from "../middlewares/verifyJWT";
import isOwnerOrAdmin from "../middlewares/isOwnerOrAdmin";
import {
    createNotificationSchema,
    notificationIdParamSchema,
    notificationQuerySchema,
    updateNotificationSchema,
} from "../validations/notificationSchema";
import {
    createNotification,
    deleteNotification,
    getAllNotifications,
    getNotificationById,
    markAsRead,
    updateNotification,
    markAllAsRead,
} from "../controllers/notificationController";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, readAt, type], default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: unread
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: List of notifications }
 *   post:
 *     summary: Create a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, message]
 *             properties:
 *               type: { type: string }
 *               userId: { type: string }
 *               message: { type: string }
 *     responses:
 *       201: { description: Created notification }
 */
router
    .route("/")
    .get(
        buildValidator({ query: notificationQuerySchema }),
        getAllNotifications
    )
    .post(
        verifyJWT,
        buildValidator({ body: createNotificationSchema }),
        createNotification
    );

// mark all as read for a user (mounted at /users/:userId/notifications)
router.patch("/read-all", verifyJWT, isOwnerOrAdmin, markAllAsRead);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notification found }
 *       404: { description: Notification not found }
 *   patch:
 *     summary: Update notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message: { type: string }
 *               readAt: { type: string, format: date-time }
 *     responses:
 *       200: { description: Updated notification }
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Deleted notification }
 */
router
    .route("/:notificationId")
    .all(buildValidator({ params: notificationIdParamSchema }))
    .get(getNotificationById)
    .patch(
        // verifyJWT,
        // isOwnerOrAdmin,
        buildValidator({ body: updateNotificationSchema }),
        updateNotification
    )
    .delete(verifyJWT, isOwnerOrAdmin, deleteNotification);

// mark as read convenience
router.post(
    "/:notificationId/read",
    buildValidator({ params: notificationIdParamSchema }),
    markAsRead
);

export default router;
