class PlayApp{
    _GameToken = ""
    _SocketStatus = ""
    _OldSiteTitle = ""
    _LoopDelayCount = 0
    _PlayerName = ""



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
            // Play.WebSocketController(data)
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

})