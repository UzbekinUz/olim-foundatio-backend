const applicationController = require('../controllers/applicationController')
module.exports = require('express')()
.post('/add', applicationController.add)
.get('/getall', applicationController.getAll)