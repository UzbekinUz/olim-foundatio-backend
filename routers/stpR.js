const stpAppController = require('../controllers/stpC');
const stipendiyatW = require('../middlewares/stpendiyatW');
const adminWare = require("../middlewares/adminWare");
module.exports = require('express')()
  .post("/apply", stipendiyatW, stpAppController.submitApp)
  .get("/checkapp/:id", stipendiyatW, stpAppController.checkActiveApplication)
  .get("/getapplicationsbyperiod/:periodId", adminWare, stpAppController.getApplicationsByPeriod)
  .post("/getallapplicationsfordmin", adminWare, stpAppController.getAllApplicationsForAdmin)
  .get("/getapplicationbyid/:id", adminWare, stpAppController.getApplicationById)
  .put("/gradeapplication/:applicationId", adminWare, stpAppController.gradeApplication)
  .put("/updateapplicationstatus/:applicationId", adminWare, stpAppController.updateApplicationStatus)
  .delete("/deleteapplication/:id", adminWare, stpAppController.deleteApplication)
