module.exports= require('mongoose').model('ChioService',{
    title:String,
    price:String,
    status:{
        type:String,
        default:true
    },
    timeTakes:String
})