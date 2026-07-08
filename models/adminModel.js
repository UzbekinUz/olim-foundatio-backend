module.exports= require('mongoose').model('AdminOlim',{
    username:String,
    password:String,
    role:String,
    access_token:String
})