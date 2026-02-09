const express = require('express');
const router = express.Router();
const Categories = require("../db/models/Categories.js")
const Response = require("../lib/Response.js")
const CustomError = require("../lib/Error.js")
const Enum = require("../config/enum.js")
const Auditlogs = require("../lib/auditlogs.js")
const logger = require("../lib/logger/LoggerClass.js")


router.get('/', async (req, res) => {
    try {
        let categories = await Categories.find({})
        res.json(Response.successResponse(categories));
    } catch (error) {
        logger.error(req.user?.email, "Categories", "List", error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
});


router.post('/add', async (req, res) => {
    let body = req.body
    try {
        if (!body.name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "name fields must be filled!")
        const category = await Categories.create({
            name: body.name,
            is_active: true,
            created_by: req.user?.id
        })

        Auditlogs.info(req.user?.email, "Categories", "Add", category)
        logger.info(req.user?.email, "Categories", "Add", category)

        res.json(Response.successResponse(category));

    } catch (error) {
        logger.error(req.user?.email, "Categories", "Add", error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
});


router.put('/update', async (req, res) => {
    let body = req.body
    try {
        if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "_id field must be filled!")
        let updates = {}
        if (body.name) updates.name = body.name
        if (typeof body.is_active === "boolean") updates.is_active = body.is_active
        let category = await Categories.updateOne({ _id: body._id }, updates)

        Auditlogs.info(req.user?.email, "Categories", "Update", { _id: body._id, ...updates })
        logger.info(req.user?.email, "Categories", "Update", JSON.stringify({ _id: body._id, ...updates }))

        res.json(Response.successResponse(category));
    } catch (error) {
        logger.error(req.user?.email, "Categories", "Update", error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
});


router.delete('/delete', async (req, res) => {
    let body = req.body
    try {
        if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "_id field must be filled!")
        let category = await Categories.deleteOne({ _id: body._id })

        Auditlogs.info(req.user?.email, "Categories", "Delete", { _id: body._id })
        logger.info(req.user?.email, "Categories", "Delete", JSON.stringify({ _id: body._id }))

        res.json(Response.successResponse(category));
    } catch (error) {
        logger.error(req.user?.email,"Categories","Delete", error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
});

module.exports = router;
