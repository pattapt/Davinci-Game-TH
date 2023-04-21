const express = require('express')
const path = require('path')
const router = express.Router()



const Controller = require('../route/RouteController')



router.get("/", (Req, Res)=>{
    Res.render('home')
})



module.exports = router