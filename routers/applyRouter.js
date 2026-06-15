module.exports=require('express')()
.post('/add',require('../controllers/applyController').add)
.put('/updatestatus',require('../controllers/applyController').updateStatus)