const chioController = require('../controllers/chioController');
const barberWare = require('../middlewares/barberWare');
const clientWare = require('../middlewares/clientWare');

module.exports = require('express')()
// client uchun
.post('/client/add', chioController.addClient)
.post('/client/enter', chioController.signin)
.put('/client/edit', chioController.editClient)
.get('/client/check', clientWare, chioController.check)
.get('/client/leave', clientWare, chioController.leave)
.get('/client/getall', chioController.getAll)
// Barber uchun
.post('/barber/add', chioController.addBarber)
.post('/barber/enter',  chioController.signinB)
.put('/barber/edit', chioController.editBarber)
.get('/barber/check', barberWare, chioController.checkB)
.get('/barber/leave', barberWare, chioController.leaveB)
.get('/barber/getall', chioController.getAllB)
//Service uchun
.post('/service/add', chioController.addService)
.put('/service/edit', chioController.editService)
.delete('/service/delete', chioController.deleteService)
.get('/service/getall', chioController.getAllServices)
//Table uchun
//Orderlar uchun
.post('/order/add', chioController.addOrder)
.delete('/order/delete', chioController.deleteOrder)
.get('/order/getall', chioController.getAllOrders)
.get('/order/getone/:id',clientWare, chioController.getOneOrder)
.get('/order/getbyclient/:clientId', clientWare, chioController.getOrderByClient)
.get('/order/getbybarber/:clientId', barberWare, chioController.getOrderByBarber)
.put('/order/changeStatus', chioController.changeStatus)
//Mayda chuydalar
.post('/table/checkAvailable', chioController.getAvailableSlots)
.post('/barber/addbusy', chioController.addBusy)