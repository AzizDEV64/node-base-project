const passport = require("passport")
const { Strategy, ExtractJwt } = require("passport-jwt")
const Users = require("../db/models/Users.js")
const UserRoles = require("../db/models/UserRoles.js")
const RolePrivileges = require("../db/models/RolePrivileges.js")
const config = require("../config/index.js")
const privs = require("../config/role_privileges.js")
const { HTTP_CODES } = require("../config/enum.js")
const Response = require("./Response.js")
const CustomError = require("./Error.js")
module.exports = function () {

    let strategy = new Strategy({
        secretOrKey: config.JWT_KEY,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    }, async (payload, done) => {
        try {
            let user = await Users.findById(payload.id)
            if (user) {
                let userRoles = await UserRoles.find({ user_id: user._id })
                let rolePrivileges = await RolePrivileges.find({ role_id: { $in: userRoles.map(ur => ur.role_id) } })
                let realRolePrivs = rolePrivileges.map(rp => privs.privileges.find(priv => priv.key == rp.permissions))
                done(null, {
                    id: user._id,
                    email: user.email,
                    roles: realRolePrivs,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
                })

            } else done(new Error("User not found!"), null)
        } catch (error) {
            done(error, null)
        }

    })
    passport.use(strategy)

    return {
        initialize: function () {
            return passport.initialize()
        },
        authenticate: function () {
            return passport.authenticate("jwt", { session: false })
        },
        checkRoles: function (expectedRoles = []) {
            return (req, res, next) => {

                const permissions = req.user.roles.map(x => x.key);

                const hasPermission = expectedRoles.some(role =>
                    permissions.includes(role)
                );

                if (hasPermission) {
                    return next();
                }

                return res.status(HTTP_CODES.UNAUTHORIZED).json(Response.errorResponse(new CustomError(HTTP_CODES.UNAUTHORIZED,"Need permissions","Need Permission")))
            }
        }

    }
}
