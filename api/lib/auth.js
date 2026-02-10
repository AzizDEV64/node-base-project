const passport = require("passport")
const { Strategy, ExtractJwt } = require("passport-jwt")
const Users = require("../db/models/Users.js")
const UserRoles = require("../db/models/UserRoles.js")
const RolePrivileges = require("../db/models/RolePrivileges.js")
const config = require("../config/index.js")

module.exports = function () {

    let strategy = new Strategy({
        secretOrKey: config.JWT_KEY,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    }, async (payload, done) => {
        try {
            let user = await Users.findById( payload.id )
            if (user) {
                let userRoles = await UserRoles.find({ user_id: user._id })
                let rolePrivileges = await RolePrivileges.find({ role_id: { $in: userRoles.map(ur => ur.role_id) } })
                done(null, {
                    id: user._id,
                    email: user.email,
                    roles: rolePrivileges,
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
        }
    }
}
