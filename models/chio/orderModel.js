const mongoose = require('mongoose')
module.exports= mongoose.model('ChioOrder',{
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChioClient' // Bu yerda 'Barber' sizning Barber modelingizni eksport qilgan nomingiz bo'lishi kerak
    },
    barberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChioBarber' // Bu yerda 'Barber' sizning Barber modelingizni eksport qilgan nomingiz bo'lishi kerak
    },
    servicesId: [{ // Agar massiv bo'lsa
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChioService' // Bu yerda 'Service' sizning Service modelingizni eksport qilgan nomingiz bo'lishi kerak
    }],
    tableId: String,
    totalPrice: String,
    appointmentDate: String,
    status: {
        type: String,
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    timeTakes:String
})