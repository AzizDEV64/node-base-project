const express = require('express');
const router = express.Router();
const Roles = require("../db/models/Roles.js")
const RolePrivileges = require("../db/models/RolePrivileges.js")
const Response = require("../lib/Response.js")
const CustomError = require("../lib/Error.js")
const Enum = require("../config/enum.js");
const role_privileges = require('../config/role_privileges.js');
const logger = require("../lib/logger/LoggerClass.js")
const Auditlogs = require("../lib/auditlogs.js")
const auth = require("../lib/auth.js")()
router.all("*",auth.authenticate(),(req,res,next) => {
  next()
})

router.get('/',auth.checkRoles(["role_view"]), async (req, res) => {
    try {
        let roles = await Roles.find({})
        res.json(Response.successResponse(roles));
    } catch (error) {
        logger.error(req.user?.email, "Roles", "List", error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
});
router.post('/add',auth.checkRoles(["role_add"]), async (req, res) => {
    let body = req.body
    try {
        if (!body.role_name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "role_name field must be filled!")
        if (!body.permissions || !Array.isArray(body.permissions) || body.permissions.length == 0) {
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "permissions field must be array!")
        }
        const role = await Roles.create({
            role_name: body.role_name,
            is_active: true,
            created_by: req.user?.id
        })
        for (let i = 0; i < body.permissions.length; i++) {
            let role_privs = new RolePrivileges({
                role_id: role._id,
                permissions: body.permissions[i],
                created_by: req.user?.id
            })
            await role_privs.save()
        }

        Auditlogs.info(req.user?.email, "Roles", "Add", {role,permissions:body.permissions})
        logger.info(req.user?.email, "Roles", "Add", JSON.stringify({role,permissions:body.permissions}))

        res.json(Response.successResponse(role));
    } catch (error) {
        // console.error(error)
        
        logger.error(req.user?.email, "Roles", "Add", error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
});
router.put('/update',auth.checkRoles(["role_update"]), async (req, res) => {
    let body = req.body
    try {
        if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "_id field must be filled!")
        let updates = {}
        if (body.role_name) updates.role_name = body.role_name
        if (typeof body.is_active === "boolean") updates.is_active = body.is_active
        if (body.permissions && Array.isArray(body.permissions)) {

            await RolePrivileges.deleteMany({ role_id: body._id })

            if (body.permissions.length > 0) {
                const newDocs = body.permissions.map(p => ({
                    role_id: body._id,
                    permissions: p,
                    created_by: req.user?.id
                }));

                await RolePrivileges.insertMany(newDocs)
            }
        }
        
        let roles = await Roles.updateOne({ _id: body._id }, updates)
        
        // console.log(roles)
        Auditlogs.info(req.user?.email, "Roles", "Update", {_id: body._id,updates,permissions:body.permissions})
        logger.info(req.user?.email, "Roles", "Update", JSON.stringify({_id: body._id,updates,permissions:body.permissions}))
        res.json(Response.successResponse(roles));
    } catch (error) {
        logger.error(req.user?.email, "Roles", "Update", error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
});

    router.delete('/delete', auth.checkRoles(["role_delete"]), async (req, res) => {
        let body = req.body
        try {
            if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "_id field must be filled!")
            let roles = await Roles.deleteOne({ _id: body._id })
            await RolePrivileges.deleteMany({role_id:body._id})

            Auditlogs.info(req.user?.email, "Roles", "Delete", {_id: body._id})
            logger.info(req.user?.email, "Roles", "Delete", JSON.stringify({_id: body._id}))

            res.json(Response.successResponse(roles));
        } catch (error) {
            logger.error(req.user?.email, "Roles", "Delete", error.message)
            let errorResponse = Response.errorResponse(error)
            res.status(errorResponse.code).json(errorResponse);
        }
    });
router.get('/role_privileges', async (req, res) => {
    res.json(role_privileges)
});
module.exports = router;
