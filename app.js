const express = require('express')
const path = require('path')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session');
const ejs = require('ejs')


// Import Config and Route
const cf = require('./config/Config')
const SiteConfig = require('./config/SiteConfig')
const RouteManagerHomePage = require('./route/RouteManagerHomePage')


const app = express()
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://www.google.com", "https://code.jquery.com", "https://cdn.jsdelivr.net", "https://www.gstatic.com"],
    frameSrc: ["'self'", 'https://www.google.com/']
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


// Handle Error
app.use((req, res, next) => {
    res.status(404).render('error_docs/404')
})  
// custom error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).render('error_docs/500')
})
app.listen(80, ()=>{
    console.log("Started HorHub Server")
})
