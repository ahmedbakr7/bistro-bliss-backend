import { Router } from "express";
import { verifyJWT } from "../middlewares/verifyJWT";
import isOwnerOrAdmin from "../middlewares/isOwnerOrAdmin";
import buildValidator from "../middlewares/validation";
import {
    favouriteAddSchema,
    favouriteDetailIdParamSchema,
} from "../validations/favouritesSchema";
import {
    getFavourites,
    addFavourite,
    removeFavourite,
} from "../controllers/favouritesController";

const router = Router({ mergeParams: true });

router.get("/", verifyJWT, isOwnerOrAdmin, getFavourites);
router.post(
    "/",
    verifyJWT,
    isOwnerOrAdmin,
    buildValidator({ body: favouriteAddSchema }),
    addFavourite
);
router.delete(
    "/:detailId",
    verifyJWT,
    isOwnerOrAdmin,
    buildValidator({ params: favouriteDetailIdParamSchema }),
    removeFavourite
);

export default router;
