module.exports= require('mongoose').model('ChioClient',{
    name:String,
    phone:String,
    password:String,
    orders:Array,
    access_token:String
})