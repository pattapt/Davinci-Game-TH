class PlayApp{
    _GameToken = ""
    _SocketStatus = ""
    _OldSiteTitle = ""
    _LoopDelayCount = 0
    _PlayerName = ""
    _PlayerToken = ""
    _GameCurrentRound = 0

    WinSound = new Audio('/public/sound/win-sound.mp3')
    ChatPop = new Audio('/public/sound/chat-pop.mp3')

    WebSocketController(data){
        const ChatData = $('.dataChat .chat-list')

        if(data.you && data.you !== undefined && data.you !== ""){
            Play._PlayerToken = data.you.token
            Play._GameCurrentRound = data.current_round
        }
        if(data.status && data.status !== undefined && data.status == "start_round"){
            Play._GameCurrentRound = data.round
            ChatData.append($(`
            <div class="chat-win">
                <div class="message">
                    <div class="chat-content" data-sender-id="">
                        <p>เริ่มเกมรอบที่ ${data.round+1}</p>
                    </div>
                </div>
            </div>
            `))
            Play.ScrollDown()
        }
        if(data.status && data.status !== undefined && data.status == "start_game"){
            $(".wating-screen.chat-lottie").removeClass("d-none")
            const LottiePlayer = document.querySelector(".LottiePlayer");
            LottiePlayer.load("https://assets2.lottiefiles.com/private_files/lf30_khak9ubl.json")
            setTimeout(() => {
                $(".wating-screen.chat-lottie").addClass("d-none")
            }, 5000);
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
            Play.ScrollDown()
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
            Play.ScrollDown()
            Play.ChatPop.play()
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
            Play.ScrollDown()
            Play.WinSound.play()
        }

    }
    

    ScrollDown(){
        const chatContainer = document.querySelector('.content.chat .dataChat');
        const ElementHeight = (chatContainer.offsetHeight * 0.4) + chatContainer.offsetHeight;

        if(chatContainer.scrollHeight - chatContainer.scrollTop < ElementHeight){
            chatContainer.scrollTop = chatContainer.scrollHeight
        }
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
        Play._OldSiteTitle = document.title
        document.title = "ไม่สามารถเชื่อมต่อระบบ Live Chat ได้"
        Play._LoopDelayCount = 0;
        Play.LoopWithDelay()
    }
    
    LoopWithDelay(){
        setTimeout(() => {
          if(Play._LoopDelayCount < 5){
            // Chat.ErrorSound.play();
            Play.LoopWithDelay()
          }else{
            Play.ConnectToSocket()
            document.title = Play._OldSiteTitle
          }
          Play._LoopDelayCount++
        }, 3000);
    }
    
    ConnectToSocket(){
        const ws = new WebSocket(`${KTApp.SocketURL}/game/${this._GameToken}?type=player&name=${this._PlayerName}`);
        ws.addEventListener('error', (event) => {
            console.log('WebSocket error: ', event);
        });
        ws.onopen = function () {
            if(Play._SocketStatus == "disconnected"){
                Play._SocketStatus = "connected"
            //   Play.SuccessSound.play();
            }
            console.log("Websocket Connected", "ดำเนินการเชื่อมต่อระบบ Live Chat สำเร็จแล้ว")
        };
    
        ws.onmessage = function (event) {
            if(Play.isJsonString(event.data)){
                var data = JSON.parse(event.data);
            }else{
                var data = event.data;
            }
            Play.WebSocketController(data)
            console.log(data)
        };
      
        ws.onclose = function (event) {
            if (event.wasClean) {
                Play.CreateToastr("error", "Websocket Disconnected", "ระบบ Live Chat ไม่สามารถเชื่อมต่อได้ ระบบจะพยายามเชื่อมต่อใหม่ใน 15 วินาที หรือกรุณาลองรีโหลดหน้าเว็บ")
            } else {
                Play.CreateToastr("error", "Websocket Disconnected", "ระบบ Live Chat ไม่สามารถเชื่อมต่อได้ ระบบจะพยายามเชื่อมต่อใหม่ใน 15 วินาที หรือกรุณาลองรีโหลดหน้าเว็บ")
            }
            Play._SocketStatus = "disconnected"
            Play.ShowErrorWebsocket()
        }
    }


    Chat(){
        const Ans = document.getElementById("MessageBox").value
        if(!KTApp.isBlank(Ans)){
            let dataString = {"game_id": Play._GameToken, "round": Play._GameCurrentRound,"answer": Ans}
            var PostData = JSON.stringify(dataString);
            const Authorization = {Authorization: Play._PlayerToken}
            KTApp.RequestAjax("/player/ans", "POST", PostData, Authorization).then(Res => {
                if(Res.success){
                    document.getElementById("MessageBox").value = ""
                }
                KTApp.CheckAlert(Res)
            }).catch(error => {
                console.log(error)
                KTApp.ConnectionError()
            })
        }
    }
}

let Play = new PlayApp;

$( document ).ready(function() {
    var pathname = new URL(document.URL).pathname;
    var PathSplit = pathname.split("/")
    console.table(PathSplit)
    if(PathSplit[2] !== null && PathSplit[2] !== undefined && PathSplit[2] !== "all"){

        Play._GameToken = PathSplit[2];
        Play._PlayerName = PathSplit[3];
        Play.ConnectToSocket()
    }

    $(".SendMessage").on('click', Play.Chat)

    $("#MessageBox").keypress(function (e) {
        if(e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            Play.Chat()
        }
    });
})