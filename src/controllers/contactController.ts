import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Contact } from "../models";
import { ServiceError } from "../util/common/common";
import { Op } from "sequelize";

// @desc Create a contact message (anonymous)
// @route POST /contacts
// @access Public
export const createContact = asyncHandler(
    async (req: Request, res: Response) => {
        const contact = await Contact.create({ ...req.body });
        res.status(201).json(contact);
    }
);

// @desc List contact messages (admin use later)
// @route GET /contacts
// @access Public (could restrict later)
export const listContacts = asyncHandler(
    async (req: Request, res: Response) => {
        const {
            limit = 10,
            page = 1,
            sortBy = "createdAt",
            sortOrder = "DESC",
            ...where
        } = (req as any).validatedQuery as any;
        const offset = (page - 1) * limit;

        const { rows, count } = await Contact.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortBy, sortOrder]],
        });

        res.json({
            data: rows,
            pagination: {
                limit,
                page,
                count,
                pages: Math.ceil(count / limit),
            },
        });
    }
);

// @desc Delete a contact message (admin)
// @route DELETE /contacts/:contactId
// @access Public (could restrict later)
export const deleteContact = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.contactId;
        if (!id) {
            throw new ServiceError(
                "Contact id is required",
                400,
                "contacts:delete"
            );
        }
        const deletedCount = await Contact.destroy({ where: { id } });
        if (!deletedCount) {
            throw new ServiceError("Contact not found", 404, "contacts:delete");
        }
        res.status(200).json({ message: `Deleted contact ${id} successfully` });
    }
);
