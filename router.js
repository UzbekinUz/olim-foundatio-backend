module.exports = require('express')()
.use('/user',require('./routers/userRouter'))
.use('/apply',require('./routers/applyRouter'))