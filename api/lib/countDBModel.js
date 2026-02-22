const Users = require("../db/models/Users")
const Roles = require("../db/models/Roles")
const AuditLogs = require("../db/models/AuditLogs")
const Categories = require("../db/models/Categories")

const countDBModel = async ()=> {
    const usersLength = await Users.countDocuments()
    const rolesLength = await Roles.countDocuments()
    const auditlogsLength = await AuditLogs.countDocuments()
    const categoriesLength = await Categories.countDocuments()
    const activeUsersLength = await Users.countDocuments({is_active:true})
    const activeRolesLength = await Roles.countDocuments({is_active:true})
    const activeAuditlogsLength = await AuditLogs.countDocuments({is_active:true})
    const activeCategoriesLength = await Categories.countDocuments({is_active:true})
    return [{usersLength,rolesLength,auditlogsLength,categoriesLength},{activeUsersLength,activeRolesLength,activeAuditlogsLength,activeCategoriesLength}]
}   


module.exports = countDBModel