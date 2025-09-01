import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Booking, User } from "../models";
import { ServiceError } from "../util/common/common";
import { BookingQuery } from "../validations/bookingSchema";
import { StatusCodes } from "http-status-codes";

export const getAllBookings = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { limit, page, sortBy, sortOrder, ...where } =
            req.query as unknown as BookingQuery;
        const offset = (page - 1) * limit;

        (where as any).userId = req.params.userId || undefined;

        const { rows, count } = await Booking.findAndCountAll({
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

// @desc    Fetch a single user by ID
// @route   GET /users/:id
// @access  Private
export const getBookingById = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.bookingId;
        const booking = await Booking.findByPk(id);
        if (!booking) {
            throw new ServiceError(
                "Booking not found",
                404,
                "bookings:getById"
            );
        }
        res.json(booking);
    }
);

export const createBooking = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const booking = req.body.booking || req.body;
        const userId = req.params.userId || booking.userId;

        const user = (req as any).user ?? (await User.findByPk(userId));
        if (!user) {
            throw new ServiceError(
                "User not found",
                404,
                "booking:createBooking"
            );
        }

        const newBooking = await user.createBooking(booking);
        res.status(StatusCodes.CREATED).json({ booking: newBooking });
        return;
    }
);

// @desc    Update an existing user
// @route   PUT /users/:id
// @access  Private
export const updateBooking = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.bookingId;
        if (!id) {
            throw new ServiceError(
                "Booking id is required",
                400,
                "bookings:update"
            );
        }

        const booking = await Booking.findByPk(id);
        if (!booking) {
            throw new ServiceError("booking not found", 404, "bookings:update");
        }

        const data = req.body.booking ?? req.body; // allow either structure
        const updated = await booking.update(data);
        res.json(updated);
    }
);

// @desc    Delete a user
// @route   DELETE /users/:id
// @access  Private
export const deleteBooking = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.bookingId;
        if (!id) {
            throw new ServiceError(
                "Booking id is required",
                400,
                "bookings:delete"
            );
        }

        const deletedCount = await Booking.destroy({ where: { id } });
        if (!deletedCount) {
            throw new ServiceError("Booking not found", 404, "bookings:delete");
        }
        res.status(200).json({ message: `Deleted booking ${id} successfully` });
    }
);
