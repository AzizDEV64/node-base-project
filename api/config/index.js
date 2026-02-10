module.exports = {
    "LOG_LEVEL": process.env.LOG_LEVEL || "debug",
    "CONNECTION_STRING": process.env.CONNECTION_STRING || "mongodb://localhost:27017/node_base_project",
    "PORT": process.env.PORT || 3000,
    "JWT_KEY":process.env.JWT_KEY
}