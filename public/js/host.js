class HostApp{
    _GameToken = ""
    _SocketStatus = ""
    _OldSiteTitle = ""
    _LoopDelayCount = 0
    _HintData = []
    _CurrentAnswer = ""


    SocketManager(data){
        const ChatData = $('.dataChat .chat-list')


        if(data.room_id && data.room_id !== undefined){
            document.getElementById("RoomID").innerText = data.room_id
        }

        if(data.new_player && data.new_player !== undefined){
            const PlayerList = $(".playerlist .row")
            PlayerList.prepend($(`
                <div class="col-md-3" data-player-id="${data.new_player.id}" data-player-token="${data.new_player.token}" data-player-name="${data.new_player.name}">
                    <p>${data.new_player.name}</p>
                </div>
            `))
            ChatData.append($(`
            <div class="chat-win">
                <div class="message">
                    <div class="chat-content" data-sender-id="host">
                        <p>${data.new_player.name} เข้าร่วมเกม</p>
                    </div>
                </div>
            </div>
            `))
            Host.ScrollDown()
        }

        if(data.leave_player && data.leave_player !== undefined){
            const PlayerID = data.leave_player.id
            const Leave = $(`.row .col-md-3[data-player-id="${PlayerID}"]`)
            const PlayerName = Leave.attr("data-player-name")
            Leave.remove()

            ChatData.append($(`
            <div class="chat-leave">
                <div class="message">
                    <div class="chat-content" data-sender-id="host">
                        <p>${PlayerName} ออกจากเกม</p>
                    </div>
                </div>
            </div>
            `))
            Host.ScrollDown()
        }

        if(data.status && data.status !== undefined && data.status == "start_game"){
            $(".countdown").addClass("d-none")
            $(".game-screen").removeClass("d-none")
            if(data.game && data.game !== undefined){
                const GameData = data.game
                const ScreenIMG = $('.game-screen-img')
                document.querySelectorAll('.game-screen-img .game-img').forEach(e => e.remove());
                GameData.picture.forEach(imgdata => {
                    ScreenIMG.append($(`
                    <div class="game-img">
                        <div class="img">
                            <img src="${imgdata}" class="logo">
                        </div>
                    </div>
                    `))
                });
                Host._CurrentAnswer = data.game.result[0]
                document.getElementById("TotalWords").innerText = GameData.word
                document.getElementById("GameTitleRound").innerText = `รอบที่ ${data.round + 1} (Bonus X${GameData.bonus})`
                let LoopRound = 1;
                const HintList = $(".HintData")
                document.querySelectorAll('.HintData .col-md-6').forEach(e => e.remove());
                GameData.hint.forEach(hint => {
                    Host._HintData.push(setTimeout(() => {
                        HintList.prepend($(`
                        <div class="col-md-6 mx-auto text-center">
                                <h2 class="mb-0">${hint}</h2>
                        </div>
                        `))
                    }, 10000 + (10000 * LoopRound)))
                    LoopRound++
                });
            }
        }

        if(data.status && data.status !== undefined && data.status == "round_time_out"){
            $(".game-screen").addClass("d-none")
            $(".SummaryScore").removeClass("d-none")
            if(Host._HintData && Host._HintData !== undefined && Host._HintData.length !== 0){
                console.log("Clear all Timout")
                Host._HintData.forEach(to => {
                    clearTimeout(to)
                });
            }
            if(data.room_info && data.room_info !== undefined){
                const RoomData = data.room_info
                document.querySelectorAll('.score ul li').forEach(e => e.remove());
                if(RoomData.list && RoomData.players.length !== 0){
                    const PlayerScore = RoomData.players
                    PlayerScore.sort((a, b) => a.score - b.score);
                    const Scoreboard = $(".score ul")
                    PlayerScore.forEach(playerData => {
                        Scoreboard.prepend($(`
                        <li>
                            <div class="item">
                                <h3 class="username">${playerData.name}</h3>
                                <p class="point">${KTApp.NumberFormatWithCommaV2(playerData.score)} Point</p>
                            </div>
                        </li>
                        `))
                    })
                }
            }
            document.getElementById("answer").innerText = Host._CurrentAnswer
        }

        
        if(data.type && data.type !== undefined && data.type == "messageSend"){
            ChatData.append($(`
            <div class="chat-right">
                <div class="message">
                    <div class="chat-content" data-sender-id="${data.sender}">
                        <p>${data.data.message}</p>
                    </div>
                    <p class="chat-time mb-0 received"><small>${data.sender_name} | ${data.time}</small></p>
                </div>
            </div>
            `))
            Host.ScrollDown()
        }

        if(data.type && data.type !== undefined && data.type == "messageRecieve"){
            ChatData.append($(`
            <div class="chat-left">
                <div class="message">
                    <div class="chat-content" data-sender-id="${data.sender}">
                        <p>${data.data.message}</p>
                    </div>
                    <p class="chat-time mb-0 received"><small>${data.sender_name} | ${data.time}</small></p>
                </div>
            </div>
            `))
            Host.ScrollDown()
        }

        if(data.type && data.type !== undefined && data.type == "playerWin"){
            ChatData.append($(`
            <div class="chat-win">
                <div class="message">
                    <div class="chat-content" data-sender-id="${data.sender}">
                        <p>${data.data.message}</p>
                    </div>
                </div>
            </div>
            `))
            Host.ScrollDown()
        }


        if(data.status && data.status !== undefined && data.status == "room_end"){
            $(".EndGame").removeClass("d-none")
            $(".game-screen").addClass("d-none")
            document.getElementById("GameTitleRound").innerText = `จบเกม!`
            if(data.room_info && data.room_info !== undefined){
                const RoomData = data.room_info
                document.querySelectorAll('.score ul li').forEach(e => e.remove());
                if(RoomData.list && RoomData.players.length !== 0){
                    const PlayerScore = RoomData.players
                    PlayerScore.sort((a, b) => a.score - b.score);
                    const Scoreboard = $(".score ul")
                    let i = 1;
                    PlayerScore.forEach(playerData => {
                        let Award = "";
                        if(i == PlayerScore.length){
                            Award = "🏆"
                        }
                        Scoreboard.prepend($(`
                        <li>
                            <div class="item">
                                <h3 class="username">${Award}${playerData.name}</h3>
                                <p class="point">${KTApp.NumberFormatWithCommaV2(playerData.score)} Point</p>
                            </div>
                        </li>
                        `))
                        i++
                    })
                }
            }
        }
    }


    ScrollDown(){
        const chatContainer = document.querySelector('.content.chat .dataChat');
        const ElementHeight = (chatContainer.offsetHeight * 0.4) + chatContainer.offsetHeight;

        if(chatContainer.scrollHeight - chatContainer.scrollTop < ElementHeight){
            chatContainer.scrollTop = chatContainer.scrollHeight
        }
    }

    StartGame(){
        let dataString = {
            game_id: Host._GameToken,
        }
        var PostData = JSON.stringify(dataString);
        KTApp.RequestAjax("/host/Start", "POST", PostData).then(Res => {
            if(Res.success){
                $(".waiting-card").addClass("d-none")
                $(".game-card").removeClass("d-none")

                const LoadingPlayer = document.querySelector(".LoadingPlayer");
                LoadingPlayer.load("https://assets2.lottiefiles.com/private_files/lf30_khak9ubl.json")
            }
            console.log(Res)
            KTApp.CheckAlert(Res)
        }).catch(error => {
            console.log(error)
            KTApp.ConnectionError()
        })
    }

    ContinueGame(){
        let dataString = {
            game_id: Host._GameToken,
        }
        var PostData = JSON.stringify(dataString);
        KTApp.RequestAjax("/host/ContinueGame", "POST", PostData).then(Res => {
            if(Res.success){
                $(".SummaryScore").addClass("d-none")
                $(".game-card").removeClass("d-none")
                $(".countdown").removeClass("d-none")

                const LoadingPlayer = document.querySelector(".LoadingPlayer");
                LoadingPlayer.load("https://assets2.lottiefiles.com/private_files/lf30_khak9ubl.json")
            }
            console.log(Res)
            KTApp.CheckAlert(Res)
        }).catch(error => {
            console.log(error)
            KTApp.ConnectionError()
        })
    }



    isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    ShowErrorWebsocket(){
        Host._OldSiteTitle = document.title
        document.title = "ไม่สามารถเชื่อมต่อระบบ Live Chat ได้"
        Host._LoopDelayCount = 0;
        Host.LoopWithDelay()
    }
    
    LoopWithDelay(){
        setTimeout(() => {
          if(Host._LoopDelayCount < 5){
            // Chat.ErrorSound.play();
            Host.LoopWithDelay()
          }else{
            Host.ConnectToSocket()
            document.title = Host._OldSiteTitle
          }
          Host._LoopDelayCount++
        }, 3000);
    }
    
    ConnectToSocket(){
        const ws = new WebSocket(`${KTApp.SocketURL}/game/${this._GameToken}?type=host`);
        ws.addEventListener('error', (event) => {
            console.log('WebSocket error: ', event);
        });
        ws.onopen = function () {
            if(Host._SocketStatus == "disconnected"){
                Host._SocketStatus = "connected"
            //   Host.SuccessSound.play();
            }
            console.log("Websocket Connected", "ดำเนินการเชื่อมต่อระบบ Live Chat สำเร็จแล้ว")
        };
    
        ws.onmessage = function (event) {
            if(Host.isJsonString(event.data)){
                var data = JSON.parse(event.data);
            }else{
                var data = event.data;
            }
            // Host.WebSocketController(data)
            console.log(data)
            Host.SocketManager(data)
        };
      
        ws.onclose = function (event) {
            if (event.wasClean) {
                Host.CreateToastr("error", "Websocket Disconnected", "ระบบ Live Chat ไม่สามารถเชื่อมต่อได้ ระบบจะพยายามเชื่อมต่อใหม่ใน 15 วินาที หรือกรุณาลองรีโหลดหน้าเว็บ")
            } else {
                Host.CreateToastr("error", "Websocket Disconnected", "ระบบ Live Chat ไม่สามารถเชื่อมต่อได้ ระบบจะพยายามเชื่อมต่อใหม่ใน 15 วินาที หรือกรุณาลองรีโหลดหน้าเว็บ")
            }
            Host._SocketStatus = "disconnected"
            Host.ShowErrorWebsocket()
        }
    }
}

let Host = new HostApp;

$( document ).ready(function() {
    var pathname = new URL(document.URL).pathname;
    var PathSplit = pathname.split("/")
    console.table(PathSplit)
    if(PathSplit[2] !== null && PathSplit[2] !== undefined && PathSplit[2] !== "all"){

        Host._GameToken = PathSplit[2];
        Host.ConnectToSocket()
    }

    $(".StartNow").on('click', Host.StartGame)
    $(".ContinueGame").on('click', Host.ContinueGame)

})