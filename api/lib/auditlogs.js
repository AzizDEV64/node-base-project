const Enum = require("../config/enum")
const AuditLogs = require("../db/models/AuditLogs.js")
let instance = null
class Auditlogs {
    constructor(){
        if(!instance){
            instance = this
        }
        return instance 
    }

    info(email,location,proc_type,log){
        this.#saveToDB({
            level:"INFO",
            email,location,proc_type,log
        })
    }
    debug(email,location,proc_type,log){
        this.#saveToDB({
            level:"DEBUG",
            email,location,proc_type,log
        })
    }
    warn(email,location,proc_type,log){
        this.#saveToDB({
            level:"WARN",
            email,location,proc_type,log
        })
    }
    error(email,location,proc_type,log){
        this.#saveToDB({
            level:"ERROR",
            email,location,proc_type,log
        })
    }
    verbose(email,location,proc_type,log){
        this.#saveToDB({
            level:"VERBOSE",
            email,location,proc_type,log
        })
    }
    http(email,location,proc_type,log){
        this.#saveToDB({
            level:"HTTP",
            email,location,proc_type,log
        })
    }
    #saveToDB({level,email,location,proc_type,log}){
        AuditLogs.create({
            level,email,location,proc_type,log
        })
    }

}


module.exports = new Auditlogs()