const newsController = require('../controllers/newsController');
const adminWare = require('../middlewares/adminWare');

module.exports = require('express')()
.post('/add', adminWare, newsController.addNews)
.delete('/delete/:id', adminWare, newsController.delete)
.put('/edit/:id', adminWare, newsController.edit)
.get('/getall', newsController.getAll)
