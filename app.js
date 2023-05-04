const express = require('express')
const path = require('path')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session');
const ejs = require('ejs')
const http = require('http');
const WebSocket = require('ws');
const { v1: uuidv1, v4: uuidv4 } = require('uuid')
const url = require('url');
const _ = require('lodash');


// Import Config and Route
const cf = require('./config/Config')
const SiteConfig = require('./config/SiteConfig')
const RouteManagerHomePage = require('./route/RouteManagerHomePage')
const API = require('./module/apiController');

const app = express()
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", "https://assets3.lottiefiles.com", "https://assets2.lottiefiles.com"],
    scriptSrc: ["'self'", "https://www.google.com", "https://code.jquery.com", "https://cdn.jsdelivr.net", "https://www.gstatic.com", "https://unpkg.com"],
    frameSrc: ["'self'", 'https://www.google.com/', "tps://unpkg.com"]
    
  }
}))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())
app.use(cookieSession({
  name: 'player_session',
  keys: [cf.cookie.key1, cf.cookie.key2],
}));
app.disable('x-powered-by')
app.set('views', path.join(__dirname, "/views"))
app.set('view engine', 'ejs')
app.locals = SiteConfig

// แยก Controler ออกจากแต่ละส่วนจะได้ไม่งง
app.use("/", RouteManagerHomePage)

// ASSETS PATH กำหนดเป็น List ก็ได้
const publicDirectoryPath = path.join(__dirname, './public')
app.use(["/public"], express.static(publicDirectoryPath))



// websocket
const channels = [];
app.set('channels', channels)

wss.on('connection', function connection(ws, req) {
  const channel = req.url.substring(1);
  const Ch = channel.split("/")
  const Prefix = Ch[0];
  let GameID = Ch[1];
  GameID = GameID.split("?")[0]
  const ip = req.connection.remoteAddress;
  const SocketID = req.headers['sec-websocket-key'];

  const parsedUrl = url.parse(req.url, true);
  const queryObject = parsedUrl.query;
  const params = new URLSearchParams(queryObject);
  const type = params.get('type');
  const name = params.get('name');

  if(Prefix != "game"){
    ws.close();
    return
  }
  
  console.log(`New WebSocket connection to channel "${GameID}"`);

  if(typeof channels[GameID] === 'undefined') {
      channels[GameID] = {
        "room_id": Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        "mode": "normal",
        "time": 60,
        "max_round": 10,
        "current_round": 0,
        "max_player": 30,
        "players": []
      }
  }
  if(type !== undefined && type == "player"){
    const PlayerData = {
      "name": name,
      "id": SocketID,
      "token": uuidv4(),
      "score": 0,
      "socket": ws
    }
    channels[GameID].players.push(PlayerData);
    app.set('channels', channels)
    let Game = _.cloneDeep(channels[GameID]);
    let You = _.cloneDeep(PlayerData);
    delete You.socket
    if(Game.host !== undefined){
      delete Game.host.socket
    }
    Game.you = You
    Game.players = Game.players.map(player => {
      delete player.socket
      return player;
    });
    ws.send(JSON.stringify(Game));
    delete Game.you
    if(Game.game){
      delete Game.game
    }
    channels[GameID].players.forEach(function each(client) {
      if (client.socket.readyState === WebSocket.OPEN && client.socket != ws) {
        client.socket.send(JSON.stringify(Game));
      }
    });
    if(channels[GameID].host !== undefined){
      Game.new_player = You
      channels[GameID].host.socket.send(JSON.stringify(Game));
    }
  }

  if(type !== undefined && type == "host" && channels[GameID].host == undefined){
    channels[GameID].host = {
      "token": uuidv4(),
      "socket": ws
    }
    app.set('channels', channels)
    let Game = _.cloneDeep(channels[GameID]);
    delete Game.host.socket
    Game.players = Game.players.map(player => {
      delete player.socket
      return player;
    });
    ws.send(JSON.stringify(Game));
  }
  

  // Listen for messages from the client
  // จริงๆต้องปิดนะ เอาไว้แค่เทสพอ พอจะใช้จริงให้ส่งผ่าน /Push
  ws.on('message', function incoming(message) {
    console.log(`Received message from channel "${GameID}":`, message.toString('utf8'));

    // Broadcast the message to all clients in the channel
    channels[GameID].players.forEach(function each(client) {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(message.toString('utf8'));
      }
    });
    console.log(`Broadcast message to channel "${GameID}"`);
  });

  // Remove the WebSocket connection from the channel when it is closed
  ws.on('close', function close() {
    if(channels[GameID] && channels[GameID] !== undefined){
      console.log(`Connection to channel closed "${GameID}" From IP: ${ip} Socket ID : ${SocketID}`)
      if(channels[GameID].players !== undefined){
        // Notify to host
        if(channels[GameID].host !== undefined){
          let Game = _.cloneDeep(channels[GameID]);
          if(Game.game){
            delete Game.game
          }
          Game.leave_player = {
            id: SocketID
          }
          if(channels[GameID].host && channels[GameID].host !== undefined && Game !== undefined){
            channels[GameID].host.socket.send(JSON.stringify(Game));
          }
          
        }
        channels[GameID].players = channels[GameID].players.filter(function filter(client) {
          return client.socket !== ws;
        });
      }
      if(channels[GameID].host !== undefined && channels[GameID].host.socket == ws){
        delete channels[GameID].host
      }
      if(channels[GameID].players.length == 0 && channels[GameID].host == undefined){
        delete channels[GameID]
      }
    }
    

    app.set('channels', channels)
  });
});
app.post('/push', API.BoardCast)



// Handle Error
app.use((req, res, next) => {
    res.status(404).render('error_docs/404')
})  
// custom error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).render('error_docs/500')
})
server.listen(80, ()=>{
    console.log("Started HorHub Server")
})
