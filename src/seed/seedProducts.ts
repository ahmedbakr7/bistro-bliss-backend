import Product from "../models/product";
import fs from "fs";
import path from "path";

const products = [
    {
        name: "Classic Burger",
        description: "Juicy beef patty with lettuce, tomato, and cheddar",
        price: 1299,
        imageUrl: null,
        category: "Burgers",
    },
    {
        name: "Veggie Delight",
        description: "Grilled vegetables with hummus in a warm bun",
        price: 1099,
        imageUrl: null,
        category: "Vegetarian",
    },
    {
        name: "Chicken Wrap",
        description: "Grilled chicken, fresh veggies, and garlic sauce",
        price: 1199,
        imageUrl: null,
        category: "Wraps",
    },
    {
        name: "Caesar Salad",
        description: "Romaine, parmesan, croutons, house Caesar dressing",
        price: 899,
        imageUrl: null,
        category: "Salads",
    },
    {
        name: "Margherita Pizza",
        description: "Tomato, fresh mozzarella, basil, olive oil",
        price: 1599,
        imageUrl: null,
        category: "Pizza",
    },
];

async function ensureImageForProduct(
    index: number,
    desiredFilenameBase: string
): Promise<string | null> {
    const menuDir = path.join(process.cwd(), "src", "assets", "menu");
    if (!fs.existsSync(menuDir)) return null;

    const uploadsRoot = path.join(process.cwd(), "uploads");
    const productsUploadDir = path.join(uploadsRoot, "products");
    if (!fs.existsSync(productsUploadDir)) {
        fs.mkdirSync(productsUploadDir, { recursive: true });
    }

    const files = await fs.promises.readdir(menuDir);
    const imageFiles: string[] = files.filter((f) => /(png|jpe?g|gif|webp|avif)$/i.test(f));
    if (!imageFiles.length) return null;

    const preferred = imageFiles.find((f) => f.toLowerCase().includes(desiredFilenameBase));
    const chosen: string = preferred ? preferred : imageFiles[index % imageFiles.length];

    const baseUrl = (process.env.APP_BASE_URL || "").replace(/\/$/, "");
    const destName = `${desiredFilenameBase}-${chosen}`; // avoid collisions, keep original ext
    const publicPath = `/uploads/products/${destName}`;
    const publicImageUrl = `${baseUrl}${publicPath}`;

    const srcPath = path.join(menuDir, chosen);
    const destPath = path.join(productsUploadDir, destName);

    try {
        if (!fs.existsSync(destPath)) {
            await fs.promises.copyFile(srcPath, destPath);
        }
        return publicImageUrl;
    } catch (err) {
        console.error(`Failed to copy ${chosen} for ${desiredFilenameBase}:`, err);
        return null;
    }
}

function slugBase(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function seedProducts() {
    for (const [i, p] of products.entries()) {
        const existing = await Product.findOne({ where: { name: p.name } });

        // Ensure imageUrl
        let imageUrl = p.imageUrl as string | null;
        if (!imageUrl) {
            imageUrl = await ensureImageForProduct(i, slugBase(p.name));
        }

        if (!existing) {
            await Product.create({ ...p, imageUrl } as any);
        } else {
            const patch: any = {};
            if ((existing as any).category !== p.category) patch.category = p.category;
            // Update image if missing or not absolute
            if (!existing.imageUrl || !/^https?:\/\//i.test(existing.imageUrl)) {
                if (imageUrl) patch.imageUrl = imageUrl;
            }
            if (Object.keys(patch).length) await existing.update(patch);
        }
    }
    console.log("Product seed complete");
}
