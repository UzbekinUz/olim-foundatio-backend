module.exports= require('mongoose').model('User',{
    username:String,
    password:String,
    role:{
        type:String,
        default:"user"
    },
    access_token:String
})