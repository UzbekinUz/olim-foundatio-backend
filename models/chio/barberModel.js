module.exports= require('mongoose').model('ChioBarber',{
    name:String,
    phone:String,
    orders:Array,
    date:String,
    password:String,
    table:String,
    rank:String
})