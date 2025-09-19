import swaggerJSDoc from "swagger-jsdoc";
import env from "../util/env";

const swaggerDefinition = {
    openapi: "3.0.3",
    info: {
        title: "Bistro Bliss API",
        version: "1.0.0",
        description: "API documentation for Bistro Bliss",
    },
    servers: [
        {
            url: `http://localhost:${env.PORT || 3000}`,
            description: "Local server",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            User: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    phoneNumber: { type: "string" },
                    imageUrl: { type: "string", nullable: true },
                    role: { type: "string", enum: ["user", "admin"] },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            CreateUserInput: {
                type: "object",
                required: ["name", "email", "password", "phoneNumber"],
                properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6 },
                    phoneNumber: { type: "string" },
                },
            },
            UpdateUserInput: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    phoneNumber: { type: "string" },
                    imageUrl: { type: "string" },
                },
            },
            // Category schemas
            CreateCategoryInput: {
                type: "object",
                required: ["name", "description"],
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    imageUrl: { type: "string" },
                },
            },
            UpdateCategoryInput: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    imageUrl: { type: "string" },
                },
            },
            // Product schemas
            CreateProductInput: {
                type: "object",
                required: ["name", "description", "price"],
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    price: { type: "number" },
                    imageUrl: { type: "string" },
                    category: {
                        type: "string",
                        description: "Product category label",
                    },
                },
            },
            UpdateProductInput: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    price: { type: "number" },
                    imageUrl: { type: "string" },
                    category: {
                        type: "string",
                        description: "Product category label",
                    },
                },
            },
            // Order schemas
            CreateOrderInput: {
                type: "object",
                properties: {
                    status: { type: "string" },
                    userId: { type: "string", format: "uuid" },
                    totalPrice: { type: "number" },
                    acceptedAt: { type: "string", format: "date-time" },
                    deliveredAt: { type: "string", format: "date-time" },
                    receivedAt: { type: "string", format: "date-time" },
                },
            },
            UpdateOrderInput: {
                type: "object",
                properties: {
                    status: { type: "string" },
                    userId: { type: "string", format: "uuid" },
                    totalPrice: { type: "number" },
                    acceptedAt: { type: "string", format: "date-time" },
                    deliveredAt: { type: "string", format: "date-time" },
                    receivedAt: { type: "string", format: "date-time" },
                },
            },
            // Booking schemas
            CreateBookingInput: {
                type: "object",
                required: ["userId", "bookedAt"],
                properties: {
                    userId: { type: "string", format: "uuid" },
                    numberOfPeople: { type: "integer" },
                    bookedAt: { type: "string", format: "date-time" },
                    status: { type: "string" },
                },
            },
            UpdateBookingInput: {
                type: "object",
                properties: {
                    numberOfPeople: { type: "integer" },
                    bookedAt: { type: "string", format: "date-time" },
                    status: { type: "string" },
                },
            },
        },
    },
};

const options: swaggerJSDoc.Options = {
    swaggerDefinition,
    // paths with js/ts annotations
    apis: [
        `${process.cwd()}/src/routes/*.{ts,js}`,
        `${process.cwd()}/src/controllers/*.{ts,js}`,
    ],
};

export const swaggerSpec = swaggerJSDoc(options);
