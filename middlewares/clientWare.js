const JWT = require('jsonwebtoken');
const clientModel = require('../models/chio/clientModel');
module.exports = (req, res, next) => {
    const token = req.headers['x-client-token'];
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
                const { id } = payload;
                const $admin = await clientModel.findOne({ _id: id });
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
                    const { _id } = $admin;
                    req.user = {id:_id };
                    next();
                }
            }
        });
    }
}