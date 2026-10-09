const statController = require('../controllers/statC');
const siteDetailsController = require('../controllers/siteDetailsC');
const adminWare = require('../middlewares/adminWare');
module.exports = require('express')()
.post('/add',adminWare, siteDetailsController.addhistory)
.delete('/delete/:id', adminWare, siteDetailsController.deletehistory)
.put('/edit/:id', adminWare, siteDetailsController.edithistory)
.get('/getall', siteDetailsController.getallhistory)

//Me'zon uchun
.post('/addmark',adminWare, siteDetailsController.addmark)
.delete('/deletemark/:id', adminWare, siteDetailsController.deletemark)
.put('/editmark/:id', adminWare, siteDetailsController.editmark)
.get('/getallmark', siteDetailsController.getallmark)

//Statistikalar uchun
//1
.post('/addstat1', adminWare, statController.addstat1)
.get('/getallstat1', statController.getallstat1)
.put('/editstat1/:id', adminWare, statController.editstat1)
.delete('/deletestat1/:id', adminWare, statController.deletestat1)
//2
.post('/addstat2', adminWare, statController.addstat2)
.get('/getallstat2', statController.getallstat2)
.put('/editstat2/:id', adminWare, statController.editstat2)
.delete('/deletestat2/:id', adminWare, statController.deletestat2)
//3
.post('/addstat3', adminWare, statController.addstat3)
.get('/getallstat3', statController.getallstat3)
.put('/editstat3/:id', adminWare, statController.editstat3)
.delete('/deletestat3/:id', adminWare, statController.deletestat3)

