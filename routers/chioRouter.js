const chioController = require('../controllers/chioController');
const clientWare = require('../middlewares/clientWare');

module.exports = require('express')()
.post('/client/add', chioController.addClient)
.post('/client/enter', clientWare, chioController.signin)
.put('/client/edit', chioController.editClient)
.get('/client/check', clientWare, chioController.check)
.get('/client/leave', clientWare, chioController.leave)
.get('/client/getall', chioController.getAll)
