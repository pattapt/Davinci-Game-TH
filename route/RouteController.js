const dotenv = require('dotenv').config()
const WebSocket = require('ws');
const moment = require('moment-timezone');
const { v1: uuidv1, v4: uuidv4 } = require('uuid')
const fs = require('fs');
const _ = require('lodash');


function loadJsonFileToArray(filePath) {
  const jsonData = fs.readFileSync(filePath, 'utf-8'); // Read the file contents as a string
  const jsonObj = JSON.parse(jsonData); // Parse the JSON data into a JavaScript object
  const arrayData = Object.values(jsonObj); // Convert the object to an array
  return arrayData;
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  

const CreateRoom = (Req, Res, next) => {
    const channels = Req.app.get('channels');
    const GameType = Req.body.type
    const GameMaxPlayer = Req.body.max_player
    const GameTime = Req.body.time
    const GameRound = Req.body.max_round
    const OpenGameID = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    const GameToken = uuidv4()
    channels[GameToken] = {
        "room_id": OpenGameID,
        "token": GameToken,
        "mode": GameType,
        "time": GameTime,
        "max_round": GameRound,
        "current_round": 0,
        "max_player": GameMaxPlayer,
        "players": []
    }

    console.log(channels[GameToken])
    
    Res.json({ success: "Successfully Create Game Room", data: { game_id: OpenGameID, game_token: GameToken, mode: GameType, time: GameTime, max_round: GameRound, max_player: GameMaxPlayer }})
    return
    
}

const JoinGame = (Req, Res, next) => {
    const channels = Req.app.get('channels');
    const GameID = Req.body.game_id
    const PLAYER_NAME = Req.body.player_name

    const foundGame = Object.values(channels).find(game => game.room_id === GameID);

    if(foundGame){
        Res.json({ success: "success join game", data: { game_id: GameID, "room_url": `/play/${foundGame.token}/${PLAYER_NAME}`}})
    }else if(PLAYER_NAME == ""){
        Res.json(
            {
                "status_code": 400,
                "msg": "empty username",
                "sweetAlert": {
                    "title": "กรุณาระบุชื่อผู้เล่น",
                    "text": "บอกให้เราทราบหน่อยว่าคุณคือใคร ก่อนจะไปลุยกัน!",
                    "icon": "error",
                    "showCancelButton": false,
                    "confirmButtonColor": "#3085d6",
                    "cancelButtonColor": "#d33",
                    "confirmButtonText": "ตกลง!"
                }
            }
        )
    }else{
        Res.json(
            {
                "status_code": 400,
                "msg": "invalid room id",
                "sweetAlert": {
                    "title": "ไม่พบห้องที่คุณเลือก",
                    "text": "ไม่พบ ID ห้องที่คุณระบุ โปรดตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง",
                    "icon": "error",
                    "showCancelButton": false,
                    "confirmButtonColor": "#3085d6",
                    "cancelButtonColor": "#d33",
                    "confirmButtonText": "ตกลง!"
                }
            }
        )
    }
}


const StartGame = (Req, Res, next) => {
    const channels = Req.app.get('channels');
    const GameToken = Req.body.game_id
    const foundGame = Object.values(channels).find(game => game.token === GameToken);

    if(foundGame){
        const GameList = shuffleArray(loadJsonFileToArray('./config/davinci.json'))
        const selected = GameList.slice(0, 10);
        channels[GameToken].list = selected
        setTimeout(()=>{
            if(channels[GameToken].host && channels[GameToken].host !== undefined){
                let Game = _.cloneDeep(channels[GameToken]);
                const CurrentRound = channels[GameToken].current_round
                const DataSend = {
                    "status": "start_game",
                    "game": selected[CurrentRound],
                    "round": CurrentRound
                }
                channels[GameToken].host.socket.send(JSON.stringify(DataSend));
                console.log(channels[GameToken])
                // ส่งหา client ว่าเกมเริ่มแล้ว และบอกด้วยว่าข้ออะไร
                channels[GameToken].players.forEach(function each(client) {
                    if (client.socket.readyState === WebSocket.OPEN) {
                      client.socket.send(JSON.stringify({status: "start_round", round: CurrentRound}));
                    }
                });

                // SET TIMEOUT OF GAME

                channels[GameToken].game = setTimeout(() => {
                    if(channels[GameToken] && channels[GameToken] !== undefined){

                        let Game = _.cloneDeep(channels[GameToken]);
                        if(Game.host !== undefined){
                          delete Game.host.socket
                        }
                        Game.players = Game.players.map(player => {
                          delete player.socket
                          return player;
                        });
                        if(Game.game){
                          delete Game.game
                        }
                        channels[GameToken].host.socket.send(JSON.stringify({status: "round_time_out", round: CurrentRound, max_time: selected[CurrentRound].time, Game: Game}));
                        delete Game.list
                        channels[GameToken].players.forEach(function each(client) {
                            if (client.socket.readyState === WebSocket.OPEN) {
                              client.socket.send(JSON.stringify({status: "round_time_out", round: CurrentRound, max_time: selected[CurrentRound].time, Game: Game}));
                            }
                        });
                        
                    }
                    
                }, selected[CurrentRound].time * 1000);
            }
        }, 5000);
        // ส่งหา Client ว่าเตรียมตัว และนับถอยหลัง
        channels[GameToken].players.forEach(function each(client) {
            if (client.socket.readyState === WebSocket.OPEN) {
              client.socket.send(JSON.stringify({status: "start_game"}));
            }
        });
        Res.json(
            {
                "status_code": 200,
                "msg": "game starting",
                "success": true,
                "data": {
                    "success": true,
                    "game": selected,
                }
            }
        )
    }else{
        Res.json(
            {
                "status_code": 400,
                "msg": "invalid room id",
                "sweetAlert": {
                    "title": "ไม่พบห้องที่คุณเลือก",
                    "text": "ไม่พบ ID ห้องที่คุณระบุ โปรดตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง",
                    "icon": "error",
                    "showCancelButton": false,
                    "confirmButtonColor": "#3085d6",
                    "cancelButtonColor": "#d33",
                    "confirmButtonText": "ตกลง!"
                }
            }
        )
    }
    
}
module.exports = {
    CreateRoom,
    JoinGame,
    StartGame
}