const router = require('express')();
const periodController = require('../controllers/stpC');
const adminWare = require('../middlewares/adminWare');

module.exports = router
  .get('/getpr', periodController.getpr)
  .get('/getactivepr', periodController.getactivepr)
  .post('/addpr', adminWare, periodController.addpr)
  .put('/editpr/:id', adminWare, periodController.editpr)
  .delete('/delpr/:id', adminWare, periodController.delpr);
