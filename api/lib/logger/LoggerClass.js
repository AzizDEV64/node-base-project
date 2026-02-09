const logger = require("../logger/logger")
let instance = null
class LoggerClass {
    constructor(){
        if(!instance){
            instance = this
        }
        return instance
    }
    info(email,location,proc_type,log){
        logger.info({email,location,proc_type,log})
    }
    warn(email,location,proc_type,log){
        logger.warn({email,location,proc_type,log})
    }
    error(email,location,proc_type,log){
        logger.error({email,location,proc_type,log})
    }
    verbose(email,location,proc_type,log){
        logger.verbose({email,location,proc_type,log})
    }
    silly(email,location,proc_type,log){
        logger.silly({email,location,proc_type,log})
    }
    http(email,location,proc_type,log){
        logger.http({email,location,proc_type,log})
    }
    debug(email,location,proc_type,log){
        logger.debug({email,location,proc_type,log})
    }
    
}


module.exports = new LoggerClass()