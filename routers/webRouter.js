const webController = require('../controllers/webController');
const adminWare = require('../middlewares/adminWare');

module.exports = require('express')()
.post('/add', adminWare, webController.addPeople)
.get('/getall', webController.getAll)
.delete('/delete', adminWare, webController.deletePeople)
.put('/edit', adminWare, webController.changePeople)
