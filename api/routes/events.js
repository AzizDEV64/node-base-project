const express = require("express")
const { HTTP_CODES } = require("../config/enum")
const router = express.Router()
const emitter = require("../lib/Emitter.js")
emitter.addEmitter("notifications")
router.get("/", (req, res) => {
    res.writeHead(HTTP_CODES.OK, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
    })
    const listener = (data) => {
        res.write("data: " + JSON.stringify(data) + "\n\n")
    } 
    emitter.getEmitter("notifications").on("messages",listener)

    req.on("close",()=> {
        emitter.getEmitter("notifications").off("messages", listener)
    })

})

module.exports = router