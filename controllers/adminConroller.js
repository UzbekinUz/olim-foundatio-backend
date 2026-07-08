const mongoose = require('mongoose');
const User = require('../models/adminModel')

module.exports = {
    add: async (req, res) => {
        try {
            const { username, password, role } = req.body;

            // Qatorlar to'ldirilganini tekshirish
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

            // Password uzunligini tekshirish
            if (password.length < 6) {
                return res.send({
                    ok: false,
                    msg: "Password 6 ta belgidan kam bo'lmasligi kerak"
                });
            }

            // Username bazada bor-yo'qligini tekshirish
            const $user = await User.findOne({ username });
            if ($user) {
                return res.send({
                    ok: false,
                    msg: "Bunday username mavjud",
                });
            }

            // Bazaga saqlash
            await new User({
                username,
                password, // Eslatma: Amaliyotda bcrypt bilan shifrlash tavsiya etiladi
                role
            }).save();

            return res.send({
                ok: true,
                msg: "Muvaffaqiyatli qo'shildi"
            });

        } catch (err) {
            console.error(err);
            return res.send({
                ok: false,
                msg: "Xatolik yuz berdi"
            });
        }
    },
    getall: async (req, res) => {
        try {
            const users = await User.find();

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
    },
    edit: async (req, res) => {
        try {
            const { id } = req.body; // Tahrirlash uchun ID ni req.body yoki req.params orqali olish mumkin
            const { username, password, role } = req.body;

            if (!id) {
                return res.send({
                    ok: false,
                    msg: "Foydalanuvchi ID si ko'rsatilmadi"
                });
            }

            // Validatsiyalar
            if (username && username.length < 5) {
                return res.send({
                    ok: false,
                    msg: "Username 5 ta belgidan kam bo'lmasligi kerak"
                });
            }

            if (password && password.length < 6) {
                return res.send({
                    ok: false,
                    msg: "Password 6 ta belgidan kam bo'lmasligi kerak"
                });
            }

            // Yangilanadigan ma'lumotlarni yig'amiz
            let updateData = {};
            if (username) updateData.username = username;
            if (password) updateData.password = password;
            if (role) updateData.role = role;

            const updatedUser = await User.findByIdAndUpdate(id, updateData, { returnDocument: 'after'});

            if (!updatedUser) {
                return res.send({
                    ok: false,
                    msg: "Foydalanuvchi topilmadi"
                });
            }

            return res.send({
                ok: true,
                msg: "Muvaffaqiyatli yangilandi",
                data: updatedUser
            });

        } catch (err) {
            console.error(err);
            return res.send({
                ok: false,
                msg: "Xatolik yuz berdi"
            });
        }
    },
    delete: async (req, res) => {
        try {
            const { id } = req.params; // O'chiriladigan ID

            if (!id) {
                return res.send({
                    ok: false,
                    msg: "ID topilmadi"
                });
            }

            const deletedUser = await User.findByIdAndDelete(id);

            if (!deletedUser) {
                return res.send({
                    ok: false,
                    msg: "Foydalanuvchi topilmadi yoki allaqachon o'chirilgan"
                });
            }

            return res.send({
                ok: true,
                msg: "Muvaffaqiyatli o'chirildi"
            });

        } catch (err) {
            console.error(err);
            console.log(req.body)
            return res.send({
                ok: false,
                msg: "Xatolik yuz berdi"
            });
        }
    },
    check: async function (req, res) {
        res.send({
            ok: true,
            adminInfo: req.user
        });
    },
    signin: async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            res.send({
                ok: false,
                msg: "Qatorlarni to'ldiring!"
            });
        } else {
            const $user = await User.findOne({ username });
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
                const token = require('jsonwebtoken').sign({ adminId: $user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
                $user.set({ access_token: token }).save();
                res.send({
                    ok: true,
                    msg: "Well done!",
                    access_token: token
                });
            }
        }
    },
    leave: async (req, res) => {
        const { adminId } = req.user;
        const $user = await User.findOne({ _id: adminId });
        $user.set({ access_token: 'none' }).save();

        res.send({
            ok: true,
            msg: "Profildan chiqish amalga oshdi!"
        });
    }
};