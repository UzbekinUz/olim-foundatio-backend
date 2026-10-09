const JWT = require('jsonwebtoken');
const applicationModel = require('../models/stpendiyatM');
module.exports = (req, res, next) => {
    const token = req.headers['x-stp-token'];
    if (!token) {
        res.send({
            ok: false,
            msg: "Avtorizatsiya qiling!"
            
        });
    } else {
        JWT.verify(token, process.env.JWT_SECRET, async (err, payload) => {
            if (err) {
                res.send({
                    ok: false,
                    msg: err
                });
            } else {
                const { stpId } = payload;
                const $admin = await applicationModel.findOne({ _id: stpId });
                // console.log(stpId)
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
                    const { _id, login } = $admin;
                    req.user = {stpId:_id, login };
                    next();
                }
            }
        });
    }
}