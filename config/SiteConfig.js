const dotenv = require('dotenv').config()
const Config = {
    "main_site": {
        "title": "Davinci Game TH",
        "short_title": "Davinci",
        "description": "Davinci Game Build with Nodejs Express and Html Bootstrap jquery",
        "keywords": "Davinci, Gane",
        "author": "ppatta, Pok",
        "favicon": "/public/homepage/img/favicon.png?v=1.00",
    },
    "keys": {
        "recaptcha": process.env.RECAPTCHA_SITE_KEY,
    }
}
module.exports = Config