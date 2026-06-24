const ChioClientModel = require('../models/chio/clientModel'); // Model joylashgan yo'lni o'zingizniki bilan almashtiring

module.exports = {
    addClient: async (req, res) => {
        try {
            // req.body ichidan ma'lumotlarni qabul qilib olamiz
            const { name, phone, orders, date, password, table, rank } = req.body;

            // 1. Majburiy maydonlarni tekshirish (Masalan: ism va telefon raqami)
            if (!name || !phone) {
                return res.send({
                    ok: false,
                    msg: "Iltimos, majburiy maydonlarni (ism va telefon) to'ldiring!"
                });
            }

            // 2. Takroriy mijozni tekshirish (Agar telefon raqami unikal bo'lishi kerak bo'lsa)
            const existingClient = await ChioClientModel.findOne({ phone });
            if (existingClient) {
                return res.send({
                    ok: false,
                    msg: "Bu telefon raqami bilan allaqachon mijoz ro'yxatdan o'tgan!"
                });
            }

            // Orders massivini tekshirish va parslash (agar frontend string shaklida yuborgan bo'lsa)
            let parsedOrders = orders;
            if (typeof orders === 'string' && orders.trim() !== '') {
                try {
                    parsedOrders = JSON.parse(orders);
                } catch (e) {
                    parsedOrders = [];
                }
            }

            // 3. Yangi mijoz obyektini yaratish
            const newClient = new ChioClientModel({
                name,
                phone,
                orders: parsedOrders || [],
                date: date || new Date().toISOString(), // Agar sana kelmasa, hozirgi vaqtni yozadi
                password, // Agar xavfsizlik kerak bo'lsa, bcrypt orqali hashlab saqlash tavsiya etiladi
                table,
                rank
            });

            // 4. Ma'lumotni bazaga saqlash
            const savedClient = await newClient.save();

            // 5. Muvaffaqiyatli javob qaytarish
            return res.send({
                ok: true,
                msg: "Mijoz muvaffaqiyatli qo'shildi!",
                data: savedClient
            });

        } catch (err) {
            console.error("Mijoz qo'shishda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Mijozni saqlashda kutilmagan xatolik yuz berdi."
            });
        }
    },
    editClient: async (req, res) => {
        try {
            // Tahrirlanadigan mijozning ID-si parametrdan yoki body'dan keladi (namunada params kiritildi)
            const { id } = req.params;

            // Frontenddan kelgan barcha maydonlarni obyekt ichiga olamiz
            const updateData = req.body;

            // 1. ID kelganini tekshirish
            if (!id) {
                return res.send({
                    ok: false,
                    msg: "Mijoz ID-si ko'rsatilmadi!"
                });
            }

            // 2. Agar orders (massiv) string holatda kelgan bo'lsa, uni parslash
            if (updateData.orders && typeof updateData.orders === 'string') {
                try {
                    updateData.orders = JSON.parse(updateData.orders);
                } catch (e) {
                    return res.send({ ok: false, msg: "Orders formati noto'g'ri!" });
                }
            }

            // 3. Bazadan mijozni topish va kelgan ma'lumotlar bilan yangilash
            // { new: true } parametri yangilangan ma'lumotni qaytarishni ta'minlaydi
            // runValidators: true esa model qoidalarini tekshiradi
            const updatedClient = await ChioBarber.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            // 4. Agar bunday ID li mijoz topilmasa
            if (!updatedClient) {
                return res.send({
                    ok: false,
                    msg: "Yangilanayotgan mijoz bazadan topilmadi!"
                });
            }

            // 5. Muvaffaqiyatli javob qaytarish
            return res.send({
                ok: true,
                msg: "Mijoz ma'lumotlari muvaffaqiyatli o'zgartirildi!",
                data: updatedClient
            });

        } catch (err) {
            console.error("Mijozni tahrirlashda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Ma'lumotlarni yangilashda kutilmagan xatolik yuz berdi."
            });
        }

    },
    signin: async (req, res) => {
        try {
            // Modelda username yo'qligi sababli login uchun phone va password'dan foydalanamiz
            const { phone, password } = req.body;

            // 1. Qatorlar to'ldirilganini tekshirish
            if (!phone || !password) {
                return res.send({
                    ok: false,
                    msg: "Qatorlarni to'ldiring!"
                });
            }

            // 2. Telefon raqami orqali foydalanuvchini bazadan qidirish
            const $user = await ChioClientModel.findOne({ phone });

            if (!$user) {
                return res.send({
                    ok: false,
                    msg: "Ushbu telefon raqami bilan foydalanuvchi topilmadi!"
                });
            }

            // 3. Parolni tekshirish (ochiq matn ko'rinishida)
            if (password !== $user.password) {
                return res.send({
                    ok: false,
                    msg: "Parol xato kiritildi!"
                });
            }

            // 4. JWT token yaratish (JWT_USER_SECRET muhit o'zgaruvchisidan foydalaniladi)
            // Agarda loyihangizda dotenv ishlatilmagan bo'lsa, process.env.JWT_USER_SECRET o'rniga ixtiyoriy string yozish mumkin
            const jwtSecret = process.env.JWT_USER_SECRET
            const token = require('jsonwebtoken').sign(
                { id: $user._id },
                jwtSecret,
                { expiresIn: '1d' }
            );

            // Namunadagi kabi token qaytarish va muvaffaqiyatli javob
            return res.send({
                ok: true,
                msg: "Profilga yo'naltirildi!",
                access_token: token,
                data: $user
            });

        } catch (err) {
            console.error("Tizimga kirishda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Tizimga kirishda kutilmagan xatolik yuz berdi."
            });
        }
    },
    check: async function (req, res) {
        res.send({
            ok: true,
            userInfo: req.user
        });
    },
    leave: async (req, res) => {
        const { id } = req.user;
        const $user = await ChioClientModel.findOne({ _id: id });
        $user.set({ access_token: 'none' }).save();

        res.send({
            ok: true,
            msg: "Profildan chiqish amalga oshdi!"
        });
    },
    getAll: async (req, res) => {
        try {
            const users = await ChioClientModel.find();
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