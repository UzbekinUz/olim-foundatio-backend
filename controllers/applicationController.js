const applicationModel = require("../models/applicationModel");
const md5 = require("md5");

module.exports = {
    // 1. Yangi foydalanuvchi qo'shish va uni Google Sheetga ham yuklash
    add: async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.send({
                    ok: false,
                    msg: "Qatorlarni to'ldiring"
                });
            }

            if (username.length < 5) {
                return res.send({
                    ok: false,
                    msg: "Username 5 ta belgidan kam bo'lmasligi kerak"
                });
            }

            const $user = await applicationModel.findOne({ username });

            if ($user) {
                return res.send({
                    ok: false,
                    msg: "Bunday username mavjud",
                });
            }

            if (password.length < 6) {
                return res.send({
                    ok: false,
                    msg: "Password 6 ta belgidan kam bo'lmasligi kerak"
                });
            }

            // A. Avval MongoDB ma'lumotlar bazasiga saqlaymiz
            await new applicationModel({
                username,
                password
            }).save();

            return res.send({
                ok: true,
                msg: "Muvaffaqiyatli"
            });

        } catch (err) {
            console.error(err);
            return res.send({
                ok: false,
                msg: "Xatolik yuz berdi"
            });
        }
    },

    signin: async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            res.send({
                ok: false,
                msg: "Qatorlarni to'ldiring!"
            });
        } else {
            const $user = await applicationModel.findOne({ username });
            if (!$user) {
                res.send({
                    ok: false,
                    msg: "Ushbu nom bilan foydalanuvchi topilmadi!"
                });
            } else if (password !== $user.password) {
                res.send({
                    ok: false,
                    msg: "Parol hato kiritildi!"
                });
            } else {
                const token = require('jsonwebtoken').sign({ usernameId: $user._id }, process.env.JWT_USER_SECRET, { expiresIn: '1d' });
                $user.set({ access_token: token }).save();
                res.send({
                    ok: true,
                    msg: "Profilga yo'naltirildi!",
                    access_token: token
                });
            }
        }
    },
    check: async function (req, res) {
        res.send({
            ok: true,
            userInfo: req.user
        });
    },
    leave: async (req, res) => {
        const { usernameId } = req.user;
        const $user = await applicationModel.findOne({ _id: usernameId });
        $user.set({ access_token: 'none' }).save();
        
        res.send({
            ok: true,
            msg: "Profildan chiqish amalga oshdi!"
        });
    },
    // 2. Barcha foydalanuvchilarni bazadan olish (bunga o'zgartirish shart emas, qanday bo'lsa shunday qoldi)
    getAll: async (req, res) => {
        try {
            const users = await applicationModel.find();
            return res.send({
                ok: true,
                data: users
            });
        } catch (err) {
            console.error(err);
            return res.send({
                ok: false,
                msg: "Xatolik yuz berdi"
            });
        }
    }
};