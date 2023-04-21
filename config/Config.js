const dotenv = require('dotenv').config()
const Config = {
    "database": {
        "host": process.env.DB_HOST,
        "port": process.env.DB_PORT,
        "name": process.env.DB_NAME,
        "user": process.env.DB_USER,
        "pass": process.env.DB_PASS,
    },
    "cookie": {
        "key1": "f0e13bde-f593-40f4-b738-c683e910e1f1",
        "key2": "42e61ee0-de87-11ed-b5ea-0242ac120002"
    },
    "Recaptcha": {
        "site_key": process.env.RECAPTCHA_SITE_KEY,
        "secret_key": process.env.RECAPTCHA_SECRET_KEY
    },
}

module.exports = Config