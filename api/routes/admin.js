const router = require("express").Router()
const jwt = require("jsonwebtoken")
const config = require("../config")
const Users = require("../db/models/Users")
const UserRoles = require("../db/models/UserRoles")
const Roles = require("../db/models/Roles")
const RolePrivileges = require("../db/models/RolePrivileges")
const AuditLogs = require("../db/models/AuditLogs")
const countDBModel = require("../lib/countDBModel.js")

router.get("/panel", async (req, res) => {
    let userId;
    try {
        if (!req.cookies.jsonwebtoken) return res.redirect("/api/admin")

        jwt.verify(req.cookies.jsonwebtoken, config.JWT_KEY, (err, decoded) => {
            userId = decoded.id
        })

        const user = await Users.findById(userId, { password: 0 })
        if (!user) return res.redirect("/api/admin")

        const userRoles = await UserRoles.find({ user_id: user._id })
        const roles = await Roles.find({ _id: { $in: userRoles.map(ur => ur.role_id) } })
        const permissions = await RolePrivileges.find({ role_id: { $in: roles.map(role => role._id) } })

        let userPermissionsName = []
        permissions.map(permission => userPermissionsName.push(permission.permissions))

        let auditlogs;
        if (userPermissionsName.includes("auditlogs_view")) {
            auditlogs = await AuditLogs.find({}, { created_at: 0, updated_at: 0 }).sort({ created_at: -1 })
        }

        res.render("admin", { userPermissionsName, auditlogs, countDB: await countDBModel() })
    } catch (error) {
        res.redirect("/api/admin")
    }

})
router.get("/", (req, res) => {
    res.render("login", {
        email: "",
    })
})
router.get("/logout", (req, res) => {
    res.clearCookie("jsonwebtoken");
    res.redirect("/api/admin")
})
module.exports = router