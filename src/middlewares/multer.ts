import multer from "multer";
import User from "../models/user";
import { imageUrl, userListQuerySchema } from "../validations/userSchema";
import path from "path";

export const uploadDir = path.join(process.cwd(), "uploads");

const fileStorageEngine = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, uploadDir);
    },
    filename(req, file, callback) {
        const fileName = `${Date.now()}--${file.originalname}`;
        callback(null, fileName);
        const id = req.params.id;
        const user = User.findByPk(id).then((user) => {
            user?.update("imageUrl", fileName);
        });
    },
});

const uploader = multer({
    storage: fileStorageEngine,
    // fileFilter(req, file, callback) {},
});

export default uploader;
