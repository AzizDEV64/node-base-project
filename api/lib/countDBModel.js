const Users = require("../db/models/Users")
const Roles = require("../db/models/Roles")
const AuditLogs = require("../db/models/AuditLogs")
const Categories = require("../db/models/Categories")

const countDBModel = async ()=> {
    const usersLength = await Users.find({}).countDocuments()
    const rolesLength = await Roles.find({}).countDocuments()
    const auditlogsLength = await AuditLogs.find({}).countDocuments()
    const categoriesLength = await Categories.find({}).countDocuments()
    const activeUsersLength = await Users.find({}).countDocuments({is_active:true})
    const activeRolesLength = await Roles.find({}).countDocuments({is_active:true})
    const activeAuditlogsLength = await AuditLogs.find({}).countDocuments({is_active:true})
    const activeCategoriesLength = await Categories.find({}).countDocuments({is_active:true})
    return [{usersLength,rolesLength,auditlogsLength,categoriesLength},{activeUsersLength,activeRolesLength,activeAuditlogsLength,activeCategoriesLength}]
}   


module.exports = countDBModel