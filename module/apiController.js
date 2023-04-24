const dotenv = require('dotenv').config()
const WebSocket = require('ws');
const moment = require('moment-timezone');
const { v1: uuidv1, v4: uuidv4 } = require('uuid')


let isArray = function(a) {
    return (!!a) && (a.constructor === Array);
};
let isObject = function(a) {
    return (!!a) && (a.constructor === Object);
};
const BoardCast = (Req, Res, next) => {
    const channels = Req.app.get('channels');
    const GameID = Req.body.channel;
    const OriginalMessage = Req.body.message
    if(isArray(OriginalMessage) || isObject(OriginalMessage)){
        var message = JSON.stringify(OriginalMessage)
    }else{
        var message = OriginalMessage
    }
    
    const dateTime = moment().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
    console.log(`Received message for channel "${GameID}" from API request`);

    if(typeof channels[GameID] === 'undefined') {
        // does not exist
        console.log("API request to channel that does not exist")
        Res.json({ error: "Channel does not exist" })
        return
    }

    // Broadcast the message to all clients in the channel
    channels[GameID].players.forEach(function each(client) {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(message);
        }
    });

    if(channels[GameID].host !== undefined){
        channels[GameID].host.socket.send(message);
    }

    const MessageToken = uuidv4()
    Res.json({ success: "Successfully Send Message to channel "+GameID, data: { message_token: MessageToken, message: OriginalMessage, dateTime: dateTime }})
    return
    
}
module.exports = {
    BoardCast
}