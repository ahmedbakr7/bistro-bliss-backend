import { Router } from "express";
import buildValidator from "../middlewares/validation";
import {
    bookingIdParamSchema,
    BookingQuerySchema,
    createBookingSchema,
} from "../validations/bookingSchema";
import {
    createBooking,
    deleteBooking,
    getAllBookings,
    getBookingById,
    updateBooking,
} from "../controllers/bookingController";
import { verifyJWT } from "../middlewares/verifyJWT";
import isOwnerOrAdmin from "../middlewares/isOwnerOrAdmin";
import { updateBookingSchema } from "../validations/bookingSchema";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [bookedAt, createdAt, status, numberOfPeople], default: bookedAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: numberOfPeople
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of bookings }
 *   post:
 *     summary: Create a booking
 *     security:
 *       - bearerAuth: []
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingInput'
 *     responses:
 *       201: { description: Created booking }
 */
router
    .route("/")
    .get(buildValidator({ query: BookingQuerySchema }), getAllBookings)
    .post(
        verifyJWT,
        buildValidator({ body: createBookingSchema }),
        createBooking
    );

/**
 * @swagger
 * /bookings/{bookingId}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Booking found }
 *       404: { description: Booking not found }
 *   patch:
 *     summary: Update booking
 *     security:
 *       - bearerAuth: []
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBookingInput'
 *     responses:
 *       200: { description: Updated booking }
 *   delete:
 *     summary: Delete booking
 *     security:
 *       - bearerAuth: []
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted booking }
 */
router
    .route("/:bookingId")
    .all(buildValidator({ params: bookingIdParamSchema }))
    .get(getBookingById)
    .patch(
        // verifyJWT,
        // isOwnerOrAdmin,
        buildValidator({ body: updateBookingSchema }),
        updateBooking
    )
    .delete(verifyJWT, isOwnerOrAdmin, deleteBooking);

export default router;
