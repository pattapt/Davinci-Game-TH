class KATIC_GAME{
    // SETTING
    baseUrl = 'http://127.0.0.1'
    // baseApiUrl = 'http://cpe221.patta.dev/api-gateway'
    baseApiUrl = 'http://127.0.0.1/api-gateway'
    SocketURL = 'ws://127.0.0.1'


    // GENERAL FUNCTION
    isBlank(str) {
        return (!str || /^\s*$/.test(str));
    }

    getCookie(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length == 2) return parts.pop().split(";").shift();
    }

    setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+ d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    getCurrentDate(){
        return new Date()
    }

    ResetRecaptcha(){
        var c = $('.g-recaptcha').length;
        for (var i = 0; i < c; i++)
            grecaptcha.reset(i);
    }

    ShowErrorSweetAlert(title, description, BTNText, BTNClass){
        Swal.fire({
            title: title,
            text: description,
            icon: 'error',
            customClass: {
              confirmButton: BTNClass
            },
            buttonsStyling: false,
            confirmButtonText: BTNText,
          });
    }

    ConnectionError(){
        KTApp.ShowErrorSweetAlert("การเชื่อมต่อผิดพลาด!❌", "เกิดข้อผิดพลาดเกิดขึ้นระหว่างการเชื่อมต่อไปยัง API โปรดลองใหม่อีกครั้งภายหลัง", "ตกลง", "btn btn-danger")
    }

    ShowErrorToastr(title, description, timeout = 5000, showMethod = 'slideDown', hideMethod = 'slideUp'){
        toastr['error'](description, title, {
          closeButton: true,
          tapToDismiss: false,
          showMethod: showMethod,
          hideMethod: hideMethod,
          timeOut: timeout,
          rtl: false
        });  
    }

    CreateToastr(status, title, description, timeout = 5000, showMethod = 'slideDown', hideMethod = 'slideUp'){
        toastr[status](description, title, {
          closeButton: true,
          tapToDismiss: false,
          showMethod: showMethod,
          hideMethod: hideMethod,
          timeOut: timeout,
          rtl: false
        });  
    }

    NumberFormatWithComma(x) {
        if(KTApp.isBlank(x) || x == "") return 0;
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    NumberFormatWithCommaV2(x){
        var val = Math.round(Number(x) *100) / 100;
        var parts = val.toString().split(".");
        var num = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
        return num
    }

    PhaseTime(x){
        const date = new Date(x)
        return ((date.getHours()).toString()).padStart(2, "0") + ":" + ((date.getMinutes()).toString()).padStart(2, "0")
    }

    GenerateID(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    GenerateDefaultHeader(){
        var Sig = []
        var PostHeader = {
            "authorization" : KTApp.getCookie("csgamesecurity"),
            "x-request-with": "CSGameJS",
            "x-device-id": localStorage.getItem("device-id"),
            "x-os": localStorage.getItem("os"),
            "x-device-model": localStorage.getItem("device-model"),
            "x-notification-permission": "Yes",
            "x-platform": localStorage.getItem("platform"),
            "x-affiliate-tracking-id": localStorage.getItem("affiliate-tracking-id")
        }
        for (var key in PostHeader) {
            Sig.push(PostHeader[key])
        }
        PostHeader["x-signature"] = KTApp.GenerateID(64)
        return PostHeader
    }

    getTimestampInSeconds () {
        return Math.floor(Date.now() / 1000)
    }

    // ข้อควรระวัง อย่าลืมใส่ Polyfill Promise ด้วย กันเบราเซอร์โบราณ
    RequestAjax(endPoint, method, PostData = null, HeadersData = null){
        var ContentTypeConfig = (PostData instanceof FormData) ? false : "application/json"
        var processDataConfig = (PostData instanceof FormData) ? false : true
        var PostHeader = KTApp.GenerateDefaultHeader()
        if(HeadersData !== null){
            for (var key in HeadersData) {
                PostHeader[key] = HeadersData[key]
            }
        }
        return new Promise((resolve, reject) => {
            var request = $.ajax({
                url: this.baseApiUrl+endPoint,
                type: method,
                data: PostData,
                headers : PostHeader,
                contentType: ContentTypeConfig,
                cache: ContentTypeConfig == "application/json" ? true : false,
                processData: processDataConfig,
                xhr: function () {
                    var xhr = $.ajaxSettings.xhr();
                    xhr.upload.onprogress = function (e) {
        
                    };
                    return xhr;
                }
            });
            request.done((response) => {
                // resolve(JSON.parse(response))
                resolve(response)
            })
            request.fail(() => {
                reject()
            })
    
        })
    }

    CheckAlert(Res){
        if(Res.sweetAlert != undefined){
            Swal.fire(Res.sweetAlert).then((result) => {}) 
        }
        if(Res.toastr != undefined){
            KTApp.CreateToastr(Res.toastr.status, Res.toastr.title, Res.toastr.description)
        }
    }

    GenerateUUIDV4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }


    BobileCheck() {
        let check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
        return check;
    };

    CreateRoom(){
        let dataString = {
            type: "mormal",
            max_player: 30,
            time: 120,
            max_round: 10
        }
        var PostData = JSON.stringify(dataString);
        KTApp.RequestAjax("/host/create", "POST", PostData).then(Res => {
            if(Res.success){
                window.location = this.baseUrl+"/host/"+Res.data.game_token
            }
            console.log(Res)
            KTApp.CheckAlert(Res)
        }).catch(error => {
            console.log(error)
            KTApp.ConnectionError()
        })
    }

    JoinGame(){
        let dataString = {
            player_name: $("#username").val(),
            game_id: $("#room_id").val(),
        }
        var PostData = JSON.stringify(dataString);
        KTApp.RequestAjax("/player/join", "POST", PostData).then(Res => {
            if(Res.success){
                window.location = this.baseUrl+Res.data.room_url
            }
            console.log(Res)
            KTApp.CheckAlert(Res)
        }).catch(error => {
            console.log(error)
            KTApp.ConnectionError()
        })
    }

}


const KTApp = new KATIC_GAME


$(".CreateRoom").on('click', ()=>{
    KTApp.CreateRoom();
})

$(".JoinGame").on('click', ()=>{
    KTApp.JoinGame();
})