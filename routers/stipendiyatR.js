const stipendiatController = require('../controllers/siteController');
const stipendiatWare = require('../middlewares/stpendiyatW');
const adminWare = require('../middlewares/adminWare');

module.exports = require('express')()
  .post('/add', adminWare, stipendiatController.add)
  .get('/getall', adminWare, stipendiatController.getall)
  .get('/check', stipendiatWare, stipendiatController.check)
  .post('/signin', stipendiatController.signin)
  .get('/leave', stipendiatWare, stipendiatController.leave)
  .put('/edit', stipendiatWare, stipendiatController.edit)
  .put('/achievements', adminWare, stipendiatController.edit)
  .delete('/delete/:id', adminWare, stipendiatController.delete)
  .get('/getone/:id', stipendiatWare, stipendiatController.getone)
  .get('/getone/admin/:id',adminWare, stipendiatController.getone)
  .post('/adddocadmin', adminWare, stipendiatController.adddocadmin)
  .post('/adddocstp', stipendiatWare, stipendiatController.adddocstp)
  .delete('/deldocadmin', adminWare, stipendiatController.deldocadmin)  
  .delete('/deleteachievment/:id', adminWare, stipendiatController.deleteachievement)
  .put('/editpass', adminWare, stipendiatController.editpass)