const JWT = require('jsonwebtoken');
const applicationModel = require('../models/adminModel');
module.exports = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (!token) {
        res.send({
            ok: false,
            msg: "Avtorizatsiya qiling!"+token
            
        });
    } else {
        JWT.verify(token, process.env.JWT_SECRET, async (err, payload) => {
            if (err) {
                res.send({
                    ok: false,
                    msg: err
                });
            } else {
                const { adminId } = payload;
                const $admin = await applicationModel.findOne({ _id: adminId });
                if (!$admin) {
                    res.send({
                        ok: false,
                        msg: "Foydalanuvchi topilmadi"
                    })
                }else if($admin.access_token !== token){
                    res.send({
                        ok: false,
                        msg: "Qurulmada sessiya yakunlangan! Qayta avtorizatsiya qiling!"
                    })
                } else {
                    const { _id, username,role } = $admin;
                    req.user = {adminId:_id, username, role };
                    next();
                }
            }
        });
    }
}