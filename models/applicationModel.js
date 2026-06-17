module.exports= require('mongoose').model('User',{
    username:String,
    password:String,
    access_token:String
})