module.exports= require('mongoose').model('News',{
    title:String,
    category:String,
    date:String,
    image:String,
    content:String
})