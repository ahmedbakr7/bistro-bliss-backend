import fs from "fs";
import path from "path";
import Product from "../models/product";

/**
 * Seed products based on image files located in src/assets/menu.
 * Implementation (Option 2):
 *  - Copies each menu image into uploads/products (creating the folder if needed)
 *  - Stores imageUrl as absolute URL (APP_BASE_URL + /uploads/products/<filename>) so frontend can use it directly: <img src={product.imageUrl} />
 *  - Product name derived from filename (normalized) as before.
 *  - If product exists but lacks a proper /uploads/ imageUrl (absolute), it will be updated.
 */
export default async function seedMenuImageProducts() {
    const menuDir = path.join(process.cwd(), "src", "assets", "menu");
    if (!fs.existsSync(menuDir)) {
        console.log(
            "Menu assets directory not found, skipping seedMenuImageProducts"
        );
        return;
    }

    const uploadsRoot = path.join(process.cwd(), "uploads");
    const productsUploadDir = path.join(uploadsRoot, "products");
    if (!fs.existsSync(productsUploadDir)) {
        fs.mkdirSync(productsUploadDir, { recursive: true });
    }

    const baseUrl = (process.env.APP_BASE_URL || "").replace(/\/$/, "");

    const files = await fs.promises.readdir(menuDir);
    const imageFiles = files.filter((f) =>
        /\.(png|jpe?g|gif|webp|avif)$/i.test(f)
    );
    if (!imageFiles.length) {
        console.log("No image files in menu assets, skipping");
        return;
    }

    for (const file of imageFiles) {
        const base = file.replace(/\.[^.]+$/, "");
        // Normalize name: replace hyphens/underscores with spaces, capitalize words
        const name = base
            .replace(/[._-]+/g, " ")
            .trim()
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

        const publicPath = `/uploads/products/${file}`; // path segment
        const publicImageUrl = `${baseUrl}${publicPath}`; // absolute URL (or just path if baseUrl empty)
        const srcPath = path.join(menuDir, file);
        const destPath = path.join(productsUploadDir, file);

        // Copy file if not already copied (do not overwrite)
        try {
            if (!fs.existsSync(destPath)) {
                await fs.promises.copyFile(srcPath, destPath);
            }
        } catch (err) {
            console.error(`Failed to copy image ${file}:`, err);
            continue; // skip creating product if copy failed
        }

        const existing = await Product.findOne({ where: { name } });
        if (existing) {
            // Update imageUrl if not set or not absolute
            if (
                !existing.imageUrl ||
                !/^https?:\/\//i.test(existing.imageUrl)
            ) {
                await existing.update({ imageUrl: publicImageUrl } as any);
            }
            continue;
        }

        // Simple deterministic pseudo price: length * 100 + 599 (ensures variety but stable)
        const price = name.length * 100 + 599;

        await Product.create({
            name,
            description: `Delicious ${name} crafted from our menu image seed`,
            price,
            imageUrl: publicImageUrl,
        } as any);
    }
    console.log("seedMenuImageProducts complete");
}
