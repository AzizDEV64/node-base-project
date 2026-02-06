const mongoose = require("mongoose")
let instance = null;
class Database {
    constructor() {
        if (!instance) {
            instance = this
            this.mongoConnection = null
        }
        return instance
    }

    async connect(options) {
        try {
            console.log("DB Connecting...")
            let db = await mongoose.connect(options.CONNECTION_STRING)
            this.mongoConnection = db
            console.log("DB Connected.")
        } catch (error) {
            console.error(error)
        }
    }
}

module.exports = Database