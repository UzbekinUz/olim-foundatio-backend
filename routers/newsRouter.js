const newsController = require('../controllers/newsController');

module.exports = require('express')()
.post('/add', newsController.addNews)
.delete('/delete/:id', newsController.delete)
.put('/edit/:id', newsController.edit)
.get('/getall', newsController.getAll)
