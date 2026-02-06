const mongoose = require("mongoose")

const schema = mongoose.Schema({
    level:{type:String},
    email:{type:String},
    location:{type:String},
    proc_type:{type:String},
    log:{type:String},
},{
    versionKey:false,
    timestamps:{
    createdAt:"created_at",
    updatedAt:"updated_at"
}})

class AuditLogs extends mongoose.Model {

}

schema.loadClass(AuditLogs)
module.exports = mongoose.model("audit_logs",schema)