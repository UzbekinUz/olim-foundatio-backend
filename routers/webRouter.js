const webController = require('../controllers/webController');

module.exports = require('express')()
.post('/add', webController.addPeople)
.get('/getall', webController.getAll)
.delete('/delete', webController.deletePeople)
.put('/edit', webController.changePeople)