process.env.NODE_ENV !== 'production' ? require('dotenv').config({ path: '.env' }) : null;
const app = require('express')();
const mongo = require('mongoose');
mongo.set('strictQuery', false);
mongo.connect(process.env.DB_CONNECTION_STRING).then(()=>{console.log("ulandi")});
app.use(require('express').json());
app.use(require('express').urlencoded({ extended: true }));
app.use('/public',require('express').static('public'))
app.use(require('express-fileupload')());
app.use(require('cors')({ origin: '*' }));
app.use('/api',require('./router'));
app.listen(process.env.APP_PORT);