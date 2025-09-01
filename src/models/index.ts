import Booking from "./booking";
import Order from "./order";
import OrderDetails from "./orderDetail";
import Product from "./product";
import User from "./user";
import Category from "./category";

// User ↔ Order
User.hasMany(Order, {
    as: "orders",
    foreignKey: "userId",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
});
Order.belongsTo(User, { as: "user", foreignKey: "userId" });

// User ↔ Booking
User.hasMany(Booking, {
    as: "bookings",
    foreignKey: "userId",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
Booking.belongsTo(User, { as: "user", foreignKey: "userId" });

// Order ↔ OrderDetails (line items)
Order.hasMany(OrderDetails, {
    as: "orderDetails",
    foreignKey: "orderId",
    onDelete: "CASCADE",
    hooks: true,
});
OrderDetails.belongsTo(Order, { as: "order", foreignKey: "orderId" });

// Product ↔ OrderDetails
Product.hasMany(OrderDetails, {
    as: "orderDetails",
    foreignKey: "productId",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
});
OrderDetails.belongsTo(Product, { as: "product", foreignKey: "productId" });

// Category ↔ Product
Category.hasMany(Product, {
    as: "products",
    foreignKey: "categoryId",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
});
Product.belongsTo(Category, { as: "category", foreignKey: "categoryId" });

// Convenience many-to-many: Order ↔ Product through OrderDetails (line items)
Order.belongsToMany(Product, {
    through: OrderDetails,
    as: "products",
    foreignKey: "orderId",
    otherKey: "productId",
});
Product.belongsToMany(Order, {
    through: OrderDetails,
    as: "orders",
    foreignKey: "productId",
    otherKey: "orderId",
});

export { User, Booking, Order, OrderDetails, Product, Category };
