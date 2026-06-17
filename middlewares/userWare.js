const JWT = require('jsonwebtoken');
const applicationModel = require('../models/applicationModel');
module.exports = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (!token) {
        res.send({
            ok: false,
            msg: "Avtorizatsiya qiling!"
        });
    } else {
        JWT.verify(token, process.env.JWT_USER_SECRET, async (err, payload) => {
            if (err) {
                res.send({
                    ok: false,
                    msg: err
                });
            } else {
                const { usernameId } = payload;
                const $admin = await applicationModel.findOne({ _id: usernameId });
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
                    const { _id, username,password } = $admin;
                    req.user = {usernameId:_id, username, password };
                    next();
                }
            }
        });
    }
}