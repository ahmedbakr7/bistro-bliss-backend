import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Notification, User } from "../models";
import { ServiceError } from "../util/common/common";
import { NotificationQuery } from "../validations/notificationSchema";
import { Op } from "sequelize";
import { StatusCodes } from "http-status-codes";

export const getAllNotifications = asyncHandler(
    async (req: Request, res: Response) => {
        const { limit, page, sortBy, sortOrder, unread, ...where } = (
            req as any
        ).validatedQuery as unknown as NotificationQuery;
        const offset = (page - 1) * limit;

        if (req.params.userId)
            (where as any).userId = req.params.userId || undefined;

        if (unread === true) (where as any).readAt = { [Op.is]: null };

        const { rows, count } = await Notification.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortBy, sortOrder]],
        });

        res.json({
            data: rows,
            pagination: { limit, page, count, pages: Math.ceil(count / limit) },
        });
    }
);

export const getNotificationById = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.notificationId;
        const notification = await Notification.findByPk(id);
        if (!notification) {
            throw new ServiceError(
                "Notification not found",
                404,
                "notifications:getById"
            );
        }
        res.json(notification);
    }
);

export const createNotification = asyncHandler(
    async (req: Request, res: Response) => {
        const payload = req.body.notification || req.body;
        const userId = req.params.userId || payload.userId;
        let user: any = null;
        if (userId) {
            user = (req as any).user ?? (await User.findByPk(userId));
            if (!user)
                throw new ServiceError(
                    "User not found",
                    404,
                    "notifications:create"
                );
        }

        const created = await Notification.create({
            ...payload,
            userId: userId ?? null,
        });
        res.status(StatusCodes.CREATED).json({ notification: created });
    }
);

export const updateNotification = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.notificationId;
        const existing = await Notification.findByPk(id);
        if (!existing)
            throw new ServiceError(
                "Notification not found",
                404,
                "notifications:update"
            );
        const data = req.body.notification ?? req.body;
        const updated = await existing.update(data);
        res.json(updated);
    }
);

export const deleteNotification = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.notificationId;
        const existing = await Notification.findByPk(id);
        if (!existing)
            throw new ServiceError(
                "Notification not found",
                404,
                "notifications:delete"
            );
        await existing.destroy();
        res.status(200).json({
            message: `Deleted notification ${id} successfully`,
        });
    }
);

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.notificationId;
    const existing = await Notification.findByPk(id);
    if (!existing)
        throw new ServiceError(
            "Notification not found",
            404,
            "notifications:markAsRead"
        );
    if (existing.readAt) {
        res.json(existing);
        return;
    }
    await existing.update({ readAt: new Date() });
    res.json(existing);
});

// Mark all notifications for a user as read
export const markAllAsRead = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.params.userId;
        if (!userId) {
            throw new ServiceError(
                "userId param required",
                400,
                "notifications:markAllAsRead"
            );
        }

        const now = new Date();
        const [updatedCount] = await Notification.update(
            { readAt: now },
            {
                where: {
                    userId,
                    readAt: { [Op.is]: null },
                },
            }
        );

        res.json({
            message: `Marked ${updatedCount} notifications as read`,
            updated: updatedCount,
        });
    }
);
