import { Router } from "express";
import loginLimiter from "../middlewares/loginLimiter";
import {
    login,
    logout,
    refresh,
    register,
    resetPassword,
    sendResetPassword,
    verifyEmail,
} from "../controllers/authController";
import buildValidator from "../middlewares/validation";
import { createUserSchema, loginSchema } from "../validations/userSchema";
import {
    resetPasswordSchema,
    sendResetPasswordSchema,
    verifyEmailSchema,
} from "../validations/authSchema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       201: { description: User registered }
 */
router
    .route("/register")
    .post(buildValidator({ body: createUserSchema }), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Logged in }
 */
router
    .route("/login")
    .post(loginLimiter, buildValidator({ body: loginSchema }), login);

/**
 * @swagger
 * /auth/refresh:
 *   get:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200: { description: Refreshed token }
 */
router.route("/refresh").get(refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out }
 */
router.route("/logout").post(logout);

router
    .route("/email/verify/:code")
    .get(buildValidator({ params: verifyEmailSchema }), verifyEmail);

router
    .route("/password/forget")
    .post(buildValidator({ body: sendResetPasswordSchema }), sendResetPassword);

router
    .route("/password/reset")
    .post(buildValidator({ body: resetPasswordSchema }), resetPassword);

export default router;
