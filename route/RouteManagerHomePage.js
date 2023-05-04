const express = require('express')
const path = require('path')
const router = express.Router()



const Controller = require('../route/RouteController')



router.get("/", (Req, Res)=>{
    Res.render('home')
})

router.get("/host/:gameid", (Req, Res)=>{
    Res.render('host')
})

router.get("/play/:gameid/:name", (Req, Res)=>{
    Res.render('play')
})


// CREATE GAME ROOM
router.post("/api-gateway/host/create", Controller.CreateRoom)
router.post("/api-gateway/host/Start", Controller.StartGame)
router.post("/api-gateway/host/ContinueGame", Controller.ContinueGame)
router.post("/api-gateway/host/EndGame", Controller.StartGame)

router.post("/api-gateway/player/join", Controller.JoinGame)
router.post("/api-gateway/player/ans", Controller.AnswerGame)

module.exports = router