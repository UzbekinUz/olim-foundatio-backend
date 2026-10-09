const applyController = require('../controllers/applyController');
const adminWare = require('../middlewares/adminWare');

module.exports = require('express')()
.post('/add', applyController.add)
.post('/resend', applyController.resend)
.put('/updatestatus', adminWare, applyController.updateStatus)
.get('/getall', adminWare, applyController.getAll)
.delete('/deleteall', adminWare, applyController.deleteAll)
.delete('/deleteone/:id', adminWare, applyController.deleteOne)
.put('/updateIsWinner', adminWare, applyController.updateWinner)
.get('/:usernameId', applyController.getOne)
