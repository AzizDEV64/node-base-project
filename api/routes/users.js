const express = require('express');
const router = express.Router();
const Users = require("../db/models/Users.js")
const Roles = require("../db/models/Roles.js")
const Response = require("../lib/Response.js")
const CustomError = require("../lib/Error.js")
const Enum = require("../config/enum.js")
const bcrypt = require("bcrypt")
const is = require("is_js");
const UserRoles = require('../db/models/UserRoles.js');
const Auditlogs = require("../lib/auditlogs.js")
const logger = require("../lib/logger/LoggerClass.js")
const jwt = require("jsonwebtoken")
const config = require("../config/index.js")
const auth = require("../lib/auth.js")()
const {rateLimit} = require("express-rate-limit")
const MongoStore = require("rate-limit-mongo")


const limiter = rateLimit({ //for login brute-force
    store: new MongoStore({
    uri: config.CONNECTION_STRING,
    expireTimeMs: 5 * 60 * 1000,
    }),
	windowMs: 5 * 60 * 1000, // 15 minutes
	limit: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
})

router.post('/register', async (req, res) => {
    let body = req.body
    try {
        let users = await Users.find({})
        if (users.length != 0) {
            return res.sendStatus(Enum.HTTP_CODES.NOT_FOUND)
        }

        if (!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "email field must be filled!")
        if (!body.password) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "password field must be filled!")
        if (body.password.length < 8) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "password length must be greater than 8!")
        if (!is.email(body.email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "email field must be an email!")

        let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);

        const user = await Users.create({
            email: body.email,
            password: password,
            is_active: true,
            first_name: body.first_name,
            last_name: body.last_name,
            phone_number: body.phone_number,
        })
        const role = await Roles.create({
            role_name: Enum.SUPER_ADMIN,
            created_by: user._id
        })

        await UserRoles.create({
            role_id: role._id,
            user_id: user._id
        })
        res.json(Response.successResponse(user));
    } catch (error) {
        logger.error(req.user?.email, "Users", "Register", error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
})

router.post('/login', limiter, async (req, res) => {
    try {
        let {password,email} = req.body
        if(password.length < 8 || typeof password !== "string" || is.not.email(email)) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "Validation Error!", "email or password wrong")
        let user = await Users.findOne({email})
        if(!user) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED,"Validation Error!", "email or password wrong")
        let pass = bcrypt.compareSync(password,user.password)
        if(pass == false) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED,"Validation Error!", "email or password wrong")
        let payload = {
            id:user._id,
        }
        let token = jwt.sign(payload,config.JWT_KEY,{expiresIn:"1d"})
        res.json(Response.successResponse({token,user:{_id:user._id, email:user.email, first_name:user.first_name, last_name:user.last_name}}));
    } catch (error) {
        logger.error(req.user?.email, "Users", "Login", error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
})

router.all("*",auth.authenticate(),(req,res,next) => {
  next()
})

router.get('/',auth.checkRoles(["user_view"]), async (req, res) => {
    try {
        let users = await Users.find({},{password:0}).lean()
        for(let user of users){
            let userRoles = await UserRoles.find({user_id:user._id})
            for(let userRole of userRoles){
                user.roles = await Roles.find({_id:userRole.role_id})
            }
        }
        res.json(Response.successResponse(users));
    } catch (error) {
        logger.error(req.user?.email, "Users", "List", error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
})

router.post('/add',auth.checkRoles(["user_add"]), async (req, res) => {
    let body = req.body
    try {
        if (!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "email field must be filled!")
        if (!body.password) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "password field must be filled!")
        if (body.password.length < 8) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "password length must be greater than 8!")
        if (!is.email(body.email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "email field must be an email!")
        if (!body.roles || !Array.isArray(body.roles) || body.roles.length == 0) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "roles field must be an array!")

        let roles = await Roles.find({ _id: { $in: body.roles } })
        if (roles.length == 0) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "roles field must be an array!")

        let password1 = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);

        const user = await Users.create({
            email: body.email,
            password: password1,
            is_active: true,
            first_name: body.first_name,
            last_name: body.last_name,
            phone_number: body.phone_number,
        })

        for (let i = 0; i < roles.length; i++) {
            await UserRoles.create({
                role_id: roles[i]._id,
                user_id: user._id
            })
        }

        const plainUser = user.toObject()     
        const { password, ...safeUser } = plainUser

        Auditlogs.info(req.user?.email, "Users", "Add", safeUser)
        logger.info(req.user?.email, "Users", "Add", JSON.stringify(safeUser))

        res.json(Response.successResponse(user));
    } catch (error) {
        logger.error(req.user?.email, "Users", "Add", error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
})

router.put('/update',auth.checkRoles(["user_update"]), async (req, res) => {
    let body = req.body
    try {
        if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "_id field must be filled!")
        let updates = {}
        if (body.password && body.password.length < 8) updates.password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);
        if (body.first_name) updates.first_name = body.first_name
        if (body.last_name) updates.last_name = body.last_name
        if (body.phone_number) updates.phone_number = body.phone_number
        if (typeof body.is_active === "boolean") updates.is_active = body.is_active

        if (Array.isArray(body.roles) && body.roles.length > 0) {
            const roleDocs = await Roles.find({
                 _id: { $in: body.roles }
            });

            if (roleDocs.length !== body.roles.length) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Invalid Role","One or more roles not found")

            await UserRoles.deleteMany({ user_id: body._id });

            const newDocs = roleDocs.map(role => ({
                role_id: role._id,
                user_id: body._id
            }))

            await UserRoles.insertMany(newDocs)
        }

        let user = await Users.updateOne({ _id: body._id }, updates)
        let updatedUser = await Users.findOne({_id:body._id})
        const plainUser = updatedUser.toObject()     
        const { password, ...safeUser } = plainUser
        
        Auditlogs.info(req.user?.email, "Users", "Update", safeUser)
        logger.info(req.user?.email, "Users", "Update", JSON.stringify(safeUser))
        res.json(Response.successResponse(user));
    } catch (error) {
        logger.error(req.user?.email, "Users", "Update", error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
})

router.delete('/delete',auth.checkRoles(["user_delete"]), async (req, res) => {
    let body = req.body
    try {
        if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "_id field must be filled!")
        let user = await Users.deleteOne({ _id: body._id })
        await UserRoles.deleteMany({user_id:body._id})

        res.json(Response.successResponse(user))

        Auditlogs.info(req.user?.email, "Users", "Delete", { _id: body._id })
        logger.info(req.user?.email, "Users", "Delete", JSON.stringify({ _id: body._id }))
    } catch (error) {
        logger.error(req.user?.email, "Users", "Delete", error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
})



module.exports = router;
