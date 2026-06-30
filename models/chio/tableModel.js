module.exports= require('mongoose').model('ChioTable',{
    name:String,
    barber:String,
    status:{
        type:String,
        default:"free"
    },
})