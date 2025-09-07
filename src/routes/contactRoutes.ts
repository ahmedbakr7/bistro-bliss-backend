import { Router } from "express";
import {
    createContact,
    listContacts,
    deleteContact,
} from "../controllers/contactController";
import buildValidator from "../middlewares/validation";
import {
    createContactSchema,
    contactListQuerySchema,
    contactIdParamSchema,
} from "../validations/contactSchema";
import isOwnerOrAdmin from "../middlewares/isOwnerOrAdmin";

const router = Router();

router
    .route("/")
    .get(buildValidator({ query: contactListQuerySchema }), listContacts)
    .post(buildValidator({ body: createContactSchema }), createContact);

router
    .route("/:contactId")
    .delete(
        buildValidator({ params: contactIdParamSchema }),
        // isOwnerOrAdmin,
        deleteContact
    );

export default router;
