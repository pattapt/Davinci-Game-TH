const dotenv = require('dotenv').config()
const WebSocket = require('ws');
const moment = require('moment-timezone');
const { v1: uuidv1, v4: uuidv4 } = require('uuid')
const fs = require('fs');
const _ = require('lodash');
const now = new Date();
const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };


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
        // "max_round": 2,
        "current_round": 0,
        "max_player": GameMaxPlayer,
        "players": [],
        "game_status": "free-play", // free-play - answer
        "win": [],
        "start": "",
        "countdown": []
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

    if(channels[GameToken].players.length < 2){
        Res.json(
            {
                "status_code": 400,
                "msg": "player to low",
                "sweetAlert": {
                    "title": "จำนวนผู้เล่นน้อยเกินไป",
                    "text": "ผู้เล่นน้อยเกินกว่าจะเริ่มเกม ชวนเพื่อของคุณมาเล่นอย่างน้อย 3 คนเพื่อเริ่มเกมเลย!",
                    "icon": "warning",
                    "showCancelButton": false,
                    "confirmButtonColor": "#3085d6",
                    "cancelButtonColor": "#d33",
                    "confirmButtonText": "ตกลง!"
                }
            }
        )
        return
    }

    if(foundGame){
        const GameList = shuffleArray(loadJsonFileToArray('./config/davinci.json'))
        const selected = GameList.slice(0, 10);
        channels[GameToken].list = selected

        channels[GameToken].players = channels[GameToken].players.map((player) => {
            return {
                ...player,
                answer: false,
            }
        })

        channels[GameToken].start = GetDate()
        setTimeout(()=>{
            if(channels[GameToken].host && channels[GameToken].host !== undefined){
                let Game = _.cloneDeep(channels[GameToken]);
                const CurrentRound = channels[GameToken].current_round
                channels[GameToken].game_status = "playing"
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
                        const ClientGame = _.cloneDeep(selected[CurrentRound]);
                        delete ClientGame.hint
                        delete ClientGame.result
                        client.socket.send(JSON.stringify({status: "start_round", round: CurrentRound, game: ClientGame}));
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
                        if(channels[GameToken].current_round + 1 == channels[GameToken].max_round){
                            // จบเกมแล้ว เข้าหน้าสรุปผล
                            if(channels[GameToken].host && channels[GameToken].host !== undefined){
                                channels[GameToken].host.socket.send(JSON.stringify({status: "room_end", round: CurrentRound, max_time: selected[CurrentRound].time, room_info: Game}));
                            }
                            if(channels[GameToken].players && channels[GameToken].players !== undefined){
                                delete Game.list
                                channels[GameToken].players.forEach(function each(client) {
                                    if (client.socket.readyState === WebSocket.OPEN) {
                                      client.socket.send(JSON.stringify({status: "room_end", round: CurrentRound, max_time: selected[CurrentRound].time, room_info: Game}));
                                    }
                                });
                            }
                        }else{
                            if(channels[GameToken].host && channels[GameToken].host !== undefined){
                                channels[GameToken].host.socket.send(JSON.stringify({status: "round_time_out", round: CurrentRound, max_time: selected[CurrentRound].time, room_info: Game}));
                            }
                            if(channels[GameToken].players && channels[GameToken].players !== undefined){
                                delete Game.list
                                channels[GameToken].players.forEach(function each(client) {
                                    if (client.socket.readyState === WebSocket.OPEN) {
                                      client.socket.send(JSON.stringify({status: "round_time_out", round: CurrentRound, max_time: selected[CurrentRound].time, room_info: Game}));
                                    }
                                });
                            }
                        }
                        channels[GameToken].game_status = "free-play"
                        
                    }
                    
                }, selected[CurrentRound].time * 1000);
                channels[GameToken].countdown.forEach(TimeoutList => {
                    clearTimeout(TimeoutList)
                })
                const Cd = [30, 15, 10, 5, 4, 3, 2, 1]
                Cd.forEach(TimeCOuntdown => {
                    // Countdown Zone
                    channels[GameToken].countdown.push(setTimeout(() => {
                        // 5 วินาทีสุดท้าย
                        const ChatDataOther = {
                            type: "Countdown",
                            second: TimeCOuntdown,
                            data: {
                                message: `เหลือเวลา ${TimeCOuntdown} วินาที!`
                            }
                        }
                        if(channels[GameToken].players && channels[GameToken].players !== undefined){
                            channels[GameToken].players.forEach(function each(client) {
                            if (client.socket.readyState === WebSocket.OPEN) {
                                client.socket.send(JSON.stringify(ChatDataOther));
                            }
                            });
                        }
                        if(channels[GameToken].host && channels[GameToken].host !== undefined){
                            channels[GameToken].host.socket.send(JSON.stringify(ChatDataOther));
                        }
                    }, (selected[CurrentRound].time - TimeCOuntdown) * 1000))
                });

                
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
        return
    }
    
}

const GetDate = ()=>{
    var d = new Date,
    dformat = [d.getMonth()+1,
               d.getDate(),
               d.getFullYear()].join('/')+' '+
              [d.getHours(),
               d.getMinutes(),
               d.getSeconds()].join(':');
    return d
}

const ContinueGame = (Req, Res, next) => {
    const channels = Req.app.get('channels');
    const GameToken = Req.body.game_id
    const foundGame = Object.values(channels).find(game => game.token === GameToken);

    if(foundGame){
        if(channels[GameToken].current_round + 1 == channels[GameToken].max_round){
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
            Res.json(
                {
                    "status_code": 400,
                    "data": "end game",
                    "room": Game
                }
            )
            return
        }
        const CurrentRound = channels[GameToken].current_round + 1
        channels[GameToken].current_round++
        channels[GameToken].start = GetDate()
        setTimeout(()=>{
            if(channels[GameToken].host && channels[GameToken].host !== undefined){
                channels[GameToken].players = channels[GameToken].players.map((player) => {
                    return {
                        ...player,
                        answer: false,
                    }
                })

                let Game = _.cloneDeep(channels[GameToken]);
                channels[GameToken].game_status = "playing"                
                const DataSend = {
                    "status": "start_game",
                    "game": channels[GameToken].list[CurrentRound],
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
                        if(channels[GameToken].current_round + 1 == channels[GameToken].max_round){
                            // จบเกมแล้ว เข้าหน้าสรุปผล
                            if(channels[GameToken].host && channels[GameToken].host !== undefined){
                                channels[GameToken].host.socket.send(JSON.stringify({status: "room_end", round: CurrentRound, max_time: channels[GameToken].list[CurrentRound].time, room_info: Game}));
                            }
                            if(channels[GameToken].players && channels[GameToken].players !== undefined){
                                delete Game.list
                                channels[GameToken].players.forEach(function each(client) {
                                    if (client.socket.readyState === WebSocket.OPEN) {
                                      client.socket.send(JSON.stringify({status: "room_end", round: CurrentRound, max_time: channels[GameToken].list[CurrentRound].time, room_info: Game}));
                                    }
                                });
                            }
                        }else{
                            if(channels[GameToken].host && channels[GameToken].host !== undefined){
                                channels[GameToken].host.socket.send(JSON.stringify({status: "round_time_out", round: CurrentRound, max_time: channels[GameToken].list[CurrentRound].time, room_info: Game}));
                            }
                            if(channels[GameToken].players && channels[GameToken].players !== undefined){
                                delete Game.list
                                channels[GameToken].players.forEach(function each(client) {
                                    if (client.socket.readyState === WebSocket.OPEN) {
                                      client.socket.send(JSON.stringify({status: "round_time_out", round: CurrentRound, max_time: channels[GameToken].list[CurrentRound].time, room_info: Game}));
                                    }
                                });
                            }
                        }
                        
                        channels[GameToken].game_status = "free-play"
                        
                    }
                    
                }, channels[GameToken].list[CurrentRound].time * 1000);

                channels[GameToken].countdown.forEach(TimeoutList => {
                    clearTimeout(TimeoutList)
                })

                const Cd = [30, 15, 10, 5, 4, 3, 2, 1]
                Cd.forEach(TimeCOuntdown => {
                    // Countdown Zone
                    channels[GameToken].countdown.push(setTimeout(() => {
                        // 5 วินาทีสุดท้าย
                        const ChatDataOther = {
                            type: "Countdown",
                            second: TimeCOuntdown,
                            data: {
                                message: `เหลือเวลา ${TimeCOuntdown} วินาที!`
                            }
                        }
                        if(channels[GameToken].players && channels[GameToken].players !== undefined){
                            channels[GameToken].players.forEach(function each(client) {
                            if (client.socket.readyState === WebSocket.OPEN) {
                                client.socket.send(JSON.stringify(ChatDataOther));
                            }
                            });
                        }
                        if(channels[GameToken].host && channels[GameToken].host !== undefined){
                            channels[GameToken].host.socket.send(JSON.stringify(ChatDataOther));
                        }
                    }, (channels[GameToken].list[CurrentRound].time - TimeCOuntdown) * 1000))
                });
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
                    "game": channels[GameToken].list[CurrentRound],
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

const AnswerGame = (Req, Res, next) => {
    const channels = Req.app.get('channels');
    const GameToken = Req.body.game_id
    const GameRound = Req.body.round
    const UserAnswer = Req.body.answer
    const AccounToken = Req.headers.authorization
    const foundGame = Object.values(channels).find(game => game.token === GameToken);
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    
    if(foundGame){
        const AccountFound = Object.values(channels[GameToken].players).find(player => player.token === AccounToken);
        if(!AccountFound){
            Res.json(
                {
                    "status_code": 404,
                    "msg": "invalid account id",
                    "sweetAlert": {
                        "title": "ไม่พบไอดีของคุณ",
                        "text": "ไม่พบ Session ของคุณโปรดตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง",
                        "icon": "error",
                        "showCancelButton": false,
                        "confirmButtonColor": "#3085d6",
                        "cancelButtonColor": "#d33",
                        "confirmButtonText": "ตกลง!"
                    },
                }
            )
            return
        }

        if(channels[GameToken].game_status == "free-play"){
            const ChatDataOther = {
                type: "messageRecieve",
                time: currentTime,
                sender: AccounToken,
                sender_name: AccountFound.name,
                data: {
                    message: UserAnswer
                }
            }
            if(channels[GameToken].players && channels[GameToken].players !== undefined){
                channels[GameToken].players.forEach(function each(client) {
                  if (client.socket.readyState === WebSocket.OPEN && client.token != AccounToken) {
                    client.socket.send(JSON.stringify(ChatDataOther));
                  }
                });
            }
            if(channels[GameToken].host && channels[GameToken].host !== undefined){
                channels[GameToken].host.socket.send(JSON.stringify(ChatDataOther));
            }
            ChatDataOther.type = "messageSend"
            AccountFound.socket.send(JSON.stringify(ChatDataOther));
            Res.json(
                {
                    "status_code": 200,
                    "success": true,
                }
            )
            return
        }


        if(channels[GameToken].current_round != GameRound){
            Res.json(
                {
                    "status_code": 500,
                    "msg": "game round not match",
                    "sweetAlert": {
                        "title": "คุณไม่สามารถตอบข้อนี้ได้อีกต่อไป",
                        "text": "ขณะนี้คุณไม่สามารถตอบข้อนี้ได้อีกต่อไปแล้ว",
                        "icon": "error",
                        "showCancelButton": false,
                        "confirmButtonColor": "#3085d6",
                        "cancelButtonColor": "#d33",
                        "confirmButtonText": "ตกลง!"
                    },
                }
            )
            return
        }

        if(UserAnswer == ""){
            Res.json(
                {
                    "status_code": 200,
                    "success": true,
                }
            )
            return
        }

        if(channels[GameToken].list.length !== 0){
            const Question = channels[GameToken].list[GameRound]
            if(Question.result.includes(UserAnswer)){
                if(channels[GameToken].win[GameRound] == undefined){
                    channels[GameToken].win[GameRound] = []
                }
                if(channels[GameToken].win[GameRound].includes(AccounToken)){
                    const ChatDataOther = {
                        type: "messageRecieve",
                        time: currentTime,
                        sender: AccounToken,
                        sender_name: AccountFound.name,
                        data: {
                            message: "******"
                        }
                    }
                    if(channels[GameToken].players && channels[GameToken].players !== undefined){
                        channels[GameToken].players.forEach(function each(client) {
                          if (client.socket.readyState === WebSocket.OPEN && client.token != AccounToken) {
                            client.socket.send(JSON.stringify(ChatDataOther));
                          }
                        });
                    }
                    if(channels[GameToken].host && channels[GameToken].host !== undefined){
                        channels[GameToken].host.socket.send(JSON.stringify(ChatDataOther));
                    }
                    ChatDataOther.type = "messageSend"
                    ChatDataOther.data.message = UserAnswer
                    AccountFound.socket.send(JSON.stringify(ChatDataOther));
                }else{
                    // เพิ่มคะแนนให้คนตอบถูก
                    channels[GameToken].players = channels[GameToken].players.map((player) => {
                        if(player.token === AccounToken){
                            const OnGameStartDate = new Date(channels[GameToken].start)
                            const Current = new Date(GetDate())
                            const DateDiff = ((Current - OnGameStartDate) / 1000 ) - 5;
                            const Score = (((Question.time - DateDiff) / Question.time) * 100) * Question.bonus
                            console.log(DateDiff)
                            return {
                                ...player,
                                answer: true,
                                score: player.score + Score,
                            }
                        }
                        return player
                    })
                    channels[GameToken].win[GameRound].push(AccounToken)
                    const ChatDataOther = {
                        type: "playerWin",
                        time: currentTime,
                        sender: AccounToken,
                        sender_name: AccountFound.name,
                        data: {
                            message: `${AccountFound.name} ตอบถูกแล้ว!`
                        }
                    }
                    if(channels[GameToken].players && channels[GameToken].players !== undefined){
                        channels[GameToken].players.forEach(function each(client) {
                          if (client.socket.readyState === WebSocket.OPEN && client.token != AccounToken) {
                            client.socket.send(JSON.stringify(ChatDataOther));
                          }
                        });
                    }
                    if(channels[GameToken].host && channels[GameToken].host !== undefined){
                        channels[GameToken].host.socket.send(JSON.stringify(ChatDataOther));
                    }
                    ChatDataOther.data.message = `คำตอบถูกต้อง!`
                    AccountFound.socket.send(JSON.stringify(ChatDataOther));

                    // เช็คว่าตอบถูกกันหมดหรือยัง
                    const CheckAllRes = Object.values(channels[GameToken].players).find(player => player.answer === false);
                    if(!CheckAllRes && channels[GameToken] && channels[GameToken] !== undefined){

                        clearTimeout(channels[GameToken].game)
                        channels[GameToken].countdown.forEach(TimeoutList => {
                            clearTimeout(TimeoutList)
                        })

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
                        if(channels[GameToken].current_round + 1 == channels[GameToken].max_round){
                            // จบเกมแล้ว เข้าหน้าสรุปผล
                            const CurrentRound = channels[GameToken].current_round
                            if(channels[GameToken].host && channels[GameToken].host !== undefined){
                                channels[GameToken].host.socket.send(JSON.stringify({status: "room_end", round: CurrentRound, max_time: channels[GameToken].list[CurrentRound].time, room_info: Game}));
                            }
                            if(channels[GameToken].players && channels[GameToken].players !== undefined){
                                delete Game.list
                                channels[GameToken].players.forEach(function each(client) {
                                    if (client.socket.readyState === WebSocket.OPEN) {
                                    client.socket.send(JSON.stringify({status: "room_end", round: CurrentRound, max_time: channels[GameToken].list[CurrentRound].time, room_info: Game}));
                                    }
                                });
                            }
                        }else{
                            const CurrentRound = channels[GameToken].current_round
                            if(channels[GameToken].host && channels[GameToken].host !== undefined){
                                channels[GameToken].host.socket.send(JSON.stringify({status: "round_time_out", round: CurrentRound, max_time: channels[GameToken].list[CurrentRound].time, room_info: Game}));
                            }
                            if(channels[GameToken].players && channels[GameToken].players !== undefined){
                                delete Game.list
                                channels[GameToken].players.forEach(function each(client) {
                                    if (client.socket.readyState === WebSocket.OPEN) {
                                      client.socket.send(JSON.stringify({status: "round_time_out", round: CurrentRound, max_time: channels[GameToken].list[CurrentRound].time, room_info: Game}));
                                    }
                                });
                            }
                        }
                        
                        channels[GameToken].game_status = "free-play"
                        
                    }
                }
            }else{
                const ChatDataOther = {
                    type: "messageRecieve",
                    time: currentTime,
                    sender: AccounToken,
                    sender_name: AccountFound.name,
                    data: {
                        message: UserAnswer
                    }
                }
                if(channels[GameToken].players && channels[GameToken].players !== undefined){
                    channels[GameToken].players.forEach(function each(client) {
                      if (client.socket.readyState === WebSocket.OPEN && client.token != AccounToken) {
                        client.socket.send(JSON.stringify(ChatDataOther));
                      }
                    });
                }
                if(channels[GameToken].host && channels[GameToken].host !== undefined){
                    channels[GameToken].host.socket.send(JSON.stringify(ChatDataOther));
                }
                ChatDataOther.type = "messageSend"
                AccountFound.socket.send(JSON.stringify(ChatDataOther));
    
            }
        }
        

        Res.json(
            {
                "status_code": 200,
                "success": true,
            }
        )
        return


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
                },
            }
        )
    }
}


module.exports = {
    CreateRoom,
    JoinGame,
    StartGame,
    ContinueGame,
    AnswerGame
}