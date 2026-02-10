const express = require('express');
const router = express.Router();
const Auditlogs = require("../db/models/AuditLogs.js")
const Response = require("../lib/Response.js")
const CustomError = require("../lib/Error.js")
const Enum = require("../config/enum.js")
const moment = require("moment")
const logger = require("../lib/logger/LoggerClass.js")
const auth = require("../lib/auth.js")()
router.all("*",auth.authenticate(),(req,res,next) => {
  next()
})
router.post('/', async (req, res) => {
    let body = req.body
    try {
      let query = {}
      let skip = body.skip
      let limit = body.limit
      if(typeof skip !== "number") skip = 0
      if(typeof limit !== "number" || limit > 500) limit = 500

      if(body.begin_date && body.end_date){
        query.created_at = {
          $gte:moment(body.begin_date),
          $lte:moment(body.end_date)
        }
      }else {
        query.created_at = {
          $gte:moment().subtract(1,"day").startOf("day"),
          $lte:moment()
        }
      }
      let auditlogs = await Auditlogs.find(query).sort({created_at:-1}).skip(skip).limit(limit)
      res.json(Response.successResponse(auditlogs))
    } catch (error) {
        logger.error(req.user?.email,"Auditlogs","Post",error.message)
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse);
    }
});

module.exports = router