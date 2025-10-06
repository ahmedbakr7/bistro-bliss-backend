# Bistro Bliss API – Architecture Summary

## 1. Overview
This repository implements a modular RESTful API for a restaurant platform (users, products, orders, bookings, notifications, favourites, cart, categories, contacts). It uses Express for HTTP, Sequelize (PostgreSQL) for ORM, Joi for validation, Redis for caching, Multer for uploads, and Swagger for API documentation.

## 2. Tech Stack
- Runtime: Node.js / TypeScript
- HTTP: Express ([`src/server.ts`](src/server.ts))
- ORM: Sequelize ([`src/util/database.ts`](src/util/database.ts))
- DB: PostgreSQL
- Cache: Redis ([`src/util/redis`](src/util/redis.ts) if present; initialized in [`src/index.ts`](src/index.ts))
- Validation: Joi (schemas under [`src/validations`](src/validations))
- Auth: JWT (access + refresh) in [`src/controllers/authController.ts`](src/controllers/authController.ts)
- File Uploads: Multer ([`makeUploader`](src/middlewares/multer.ts))
- API Docs: Swagger ([`src/config/swagger.ts`](src/config/swagger.ts))
- Seeding: Dynamic seed loaders in [`src/index.ts`](src/index.ts)

## 3. Runtime Flow
1. Process starts at [`src/index.ts`](src/index.ts): loads env, syncs Sequelize, seeds data, starts HTTP server, initializes Redis, registers graceful shutdown.
2. Express app constructed in [`src/server.ts`](src/server.ts).
3. Global middlewares: CORS (`corsOptions` in [`src/config/corsOptions.ts`](src/config/corsOptions.ts)), JSON parsing, static `/uploads` hosting, request logging (`logger` / [`logEvent`](src/middlewares/logger.ts)).
4. Routers mounted: `/auth`, `/users`, `/products`, `/orders`, `/bookings`, `/categories`, `/contacts`, `/notifications`.
5. Layered per-request sequence (example): Router → param/query/body validation via [`buildValidator`](src/middlewares/validation.ts) → auth (`verifyJWT`) → authorization (`isOwnerOrAdmin`) → controller → (optional) caching (`cache`) → response → error handler.

## 4. Directory / Layer Structure
- Entry / Bootstrap: [`src/index.ts`](src/index.ts), [`src/server.ts`](src/server.ts)
- Configuration: [`src/util/env.ts`](src/util/env.ts), [`src/util/database.ts`](src/util/database.ts), [`src/config/swagger.ts`](src/config/swagger.ts), [`src/config/allowedorigins.ts`](src/config/allowedorigins.ts)
- Models & Associations: [`src/models/index.ts`](src/models/index.ts) importing:
  - Users: [`User`](src/models/user.ts)
  - Products: [`Product`](src/models/product.ts)
  - Categories: [`Category`](src/models/category.ts)
  - Orders: [`Order`](src/models/order.ts)
  - OrderDetails (line items): [`OrderDetails`](src/models/orderDetail.ts)
  - Bookings: [`Booking`](src/models/booking.ts)
  - Notifications: [`Notification`](src/models/notification.ts)
  - Contacts: [`Contact`](src/models/contact.ts)
- Validation Schemas: under [`src/validations`](src/validations)
- Middlewares: auth (`verifyJWT`), ACL (`isOwnerOrAdmin`), caching (`cache`), uploads (`makeUploader`), logging (`logger`), validation (`buildValidator`), error handling (`errorHandler`, `errorHandler404`)
- Controllers: CRUD & domain logic (e.g. [`ProductController`](src/controllers/ProductController.ts), [`orderController`](src/controllers/orderController.ts), [`bookingController`](src/controllers/bookingController.ts), [`notificationController`](src/controllers/notificationController.ts), [`authController`](src/controllers/authController.ts), [`userController`](src/controllers/userController.ts), etc.)
- Seeding: [`seedUsers`](src/seed/seedUsers.ts), [`seedProducts`](src/seed/seedProducts.ts), [`seedBookings`](src/seed/seedBookings.ts), plus others (contacts, menu images)
- Utilities: Redis (`initRedis` in `src/util/redis.ts`), common helpers, error types (`ServiceError` likely in `src/util/common/common.ts`)

## 5. Data Model & Decisions
- Product `category` is a free-form string (association to Category intentionally removed; see comment in [`src/models/index.ts`](src/models/index.ts)).
- Soft deletes enabled (`paranoid: true`) across major tables.
- ENUM status domains:
  - Orders: life-cycle incl. `DRAFT`, `FAVOURITES`, etc. ([`Order`](src/models/order.ts))
  - Bookings: punctual dining states ([`Booking`](src/models/booking.ts))
  - Notifications: custom `type` string + optional `readAt`.
- Order line items store snapshots (`name_snapshot`, `price_snapshot`) for historical integrity ([`OrderDetails`](src/models/orderDetail.ts)).

## 6. Associations Summary
(Defined centrally in [`src/models/index.ts`](src/models/index.ts))
- User 1—* Orders / Bookings / Notifications
- Order 1—* OrderDetails; Product 1—* OrderDetails
- Order *—* Product via OrderDetails (convenience belongsToMany)
- Favourites + Cart implemented as special `Order.status` values (`FAVOURITES`, `DRAFT`) with helper statics (`getOrCreateCart`, `getOrCreateFavourites` in [`Order`](src/models/order.ts)).

## 7. Validation Strategy
Unified via [`buildValidator`](src/middlewares/validation.ts):
- Applies schemas for `params`, `query`, `body`
- Strips unknown fields (`stripUnknown: true`)
- Aggregates Joi error messages; throws `ServiceError`
Schemas (examples):
- Products: [`productSchema`](src/validations/productSchema.ts)
- Users: [`userSchema`](src/validations/userSchema.ts)
- Orders: [`orderSchema`](src/validations/orderSchema.ts)
- Bookings: [`bookingSchema`](src/validations/bookingSchema.ts)
- Notifications: [`notificationSchema`](src/validations/notificationSchema.ts)
- Categories: [`categorySchema`](src/validations/categorySchema.ts)
- Cart: [`cartSchema`](src/validations/cartSchema.ts)
- Favourites: [`favouritesSchema`](src/validations/favouritesSchema.ts)

## 8. Authentication & Authorization
- JWT Access + Refresh workflow handled in [`authController`](src/controllers/authController.ts)
- Access token algorithms locked to HS256
- Refresh endpoint `/auth/refresh`
- Auth cookie name unified (`COOKIE_NAME`)
- Protected routes: apply [`verifyJWT`](src/middlewares/verifyJWT.ts) then [`isOwnerOrAdmin`](src/middlewares/isOwnerOrAdmin.ts) for user-scoped resources.

## 9. File Uploads
- Multer factory [`makeUploader`](src/middlewares/multer.ts)
- Storage path: `/uploads/<folder>`
- Public exposure via `app.use("/uploads", express.static(...))` ([`src/server.ts`](src/server.ts))
- Filename entropy + sanitized extensions (`buildFilename`)
- Helper: [`buildPublicUrl`](src/middlewares/multer.ts), cleanup via [`safeUnlink`](src/middlewares/multer.ts)

## 10. Caching
- Redis-based response cache middleware [`cache`](src/middlewares/cache.ts)
- Key builder function per route; only caches successful (200) JSON responses
- Example usage in products (`getProductById` route) with key `product:<id>`

## 11. Logging
- Lightweight async append logger: [`logEvent`](src/middlewares/logger.ts)
- Ensures log directory, prints to console for dev parity.

## 12. Seeding
Dynamic + idempotent:
- Users: [`seedUsers`](src/seed/seedUsers.ts) (checks existing by email)
- Products: [`seedProducts`](src/seed/seedProducts.ts) (patches missing images & category updates)
- Bookings: [`seedBookings`](src/seed/seedBookings.ts) (optional, currently commented out in [`index.ts`](src/index.ts))
- Contacts & menu images similar pattern
Executed after DB sync in [`index.ts`](src/index.ts).

## 13. Swagger / OpenAPI
- Definition builder: [`swaggerSpec`](src/config/swagger.ts)
- Schemas cover entities & Create/Update DTOs (e.g. `CreateProductInput`, `UpdateBookingInput`)
- Served at `/api-docs` + raw `/openapi.json`

## 14. Error Handling
- Central handlers: `errorHandler` & `errorHandler404` (file not shown; referenced in [`src/server.ts`](src/server.ts))
- Validation + domain errors surfaced via `ServiceError` (consistent shape).

## 15. Performance & Integrity
- Strategic indexes: e.g. order status per user (`orders_user_status_idx`), notification user/read composite, order detail uniqueness composite (`order_details_order_product_unique`)
- Snapshotting item state for historical price/name integrity
- Bulk seeding minimizes unnecessary writes (patch vs recreate)

## 16. Security Considerations
- Limited JWT algorithms
- Cookie security toggled by environment (`IS_PROD` logic in auth controller)
- Input validation strict (unknown fields stripped)
- Rate limiting indicated for login (`loginLimiter` middleware reference)
- Avoids algorithm confusion attacks by explicit algorithm arrays.

## 17. Notable Design Choices
- Cart & favourites modeled as specialized `Order` rows (simplifies aggregation & reuse of OrderDetails).
- Product `category` denormalized to string to reduce joins and allow ad-hoc taxonomy.
- Multer encapsulated in factory for per-route customization.
- Validation middleware mutates `req.query` safely for Express 5 compatibility.

## 18. Extensibility Suggestions
- Reinstate relational Product–Category if taxonomy needs hierarchy.
- Add background job queue for notification dispatch & email tasks.
- Introduce role-based policy layer beyond `isOwnerOrAdmin`.
- Add pagination metadata wrapper (total counts) in list endpoints.
- Implement ETag / conditional requests atop cache layer.

## 19. Key Symbols (Linked)
- Middleware: [`buildValidator`](src/middlewares/validation.ts), [`cache`](src/middlewares/cache.ts), [`makeUploader`](src/middlewares/multer.ts), [`logEvent`](src/middlewares/logger.ts)
- Models: [`User`](src/models/user.ts), [`Product`](src/models/product.ts), [`Order`](src/models/order.ts), [`OrderDetails`](src/models/orderDetail.ts), [`Booking`](src/models/booking.ts), [`Notification`](src/models/notification.ts), [`Category`](src/models/category.ts)
- Controllers (examples): [`authController`](src/controllers/authController.ts), [`bookingController`](src/controllers/bookingController.ts), [`orderController`](src/controllers/orderController.ts), [`notificationController`](src/controllers/notificationController.ts), [`ProductController`](src/controllers/ProductController.ts)
- Schemas: [`productSchema`](src/validations/productSchema.ts), [`bookingSchema`](src/validations/bookingSchema.ts), [`orderSchema`](src/validations/orderSchema.ts), [`categorySchema`](src/validations/categorySchema.ts), [`notificationSchema`](src/validations/notificationSchema.ts), [`userSchema`](src/validations/userSchema.ts)

## 20. Request Lifecycle Example (Protected User Resource)
Client → `/users/:userId/orders`
→ Router (`userRoutes`) → [`buildValidator`](src/middlewares/validation.ts) param schema
→ [`loadUserByParam`](src/middlewares/loadUser.ts) (referenced)
→ Nested router (`orderRoutes`)
→ Query validation (`orderQuerySchema`)
→ (Optional auth if enabled on method) [`verifyJWT`](src/middlewares/verifyJWT.ts) + [`isOwnerOrAdmin`](src/middlewares/isOwnerOrAdmin.ts)
→ Controller (`getAllOrders`)
→ Response (possibly cached if cache layer applied in future)
→ Error funnel (`errorHandler`)
