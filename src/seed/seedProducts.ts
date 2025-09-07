import Product from "../models/product";

const products = [
    {
        name: "Classic Burger",
        description: "Juicy beef patty with lettuce, tomato, and cheddar",
        price: 1299,
        imageUrl: null,
    },
    {
        name: "Veggie Delight",
        description: "Grilled vegetables with hummus in a warm bun",
        price: 1099,
        imageUrl: null,
    },
    {
        name: "Chicken Wrap",
        description: "Grilled chicken, fresh veggies, and garlic sauce",
        price: 1199,
        imageUrl: null,
    },
    {
        name: "Caesar Salad",
        description: "Romaine, parmesan, croutons, house Caesar dressing",
        price: 899,
        imageUrl: null,
    },
    {
        name: "Margherita Pizza",
        description: "Tomato, fresh mozzarella, basil, olive oil",
        price: 1599,
        imageUrl: null,
    },
];

export default async function seedProducts() {
    for (const p of products) {
        const existing = await Product.findOne({ where: { name: p.name } });
        if (!existing) {
            await Product.create(p as any);
        }
    }
    console.log("Product seed complete");
}
