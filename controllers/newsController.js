const News = require("../models/newsModel.js")// Model yo'li
const fs = require("fs");
const md5 = require("md5")

module.exports = {
    addNews: async (req, res) => {
        try {
            // 1. express-fileupload'da matnli ma'lumotlar req.body ichida keladi
            const { title, category, date, content } = req.body;

            // Fayllar req.files ichida keladi
            const files = req.files;

            // 2. Majburiy matnli maydonlarni to'liq tekshirish
            if (!title || !category || !content) {
                return res.send({
                    ok: false,
                    msg: "Iltimos, barcha majburiy matnli maydonlarni to'ldiring (title, category, content)!"
                });
            }

            // 3. Majburiy rasm fayli kelganini tekshirish
            if (!files || !files.image) {
                return res.send({
                    ok: false,
                    msg: "Iltimos, yangilik uchun rasm faylini yuklang!"
                });
            }

            // Fayllar saqlanadigan papka mavjudligini tekshirish, bo'lmasa yaratish
            const dirPath = './public/news';
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            // Rasm fayli uchun unikal nom va saqlash yo'lini (path) yaratish
            // md5 va vaqt yordamida rasm nomlari bir xil bo'lib qolishini oldini olamiz
            const imageExtension = files.image.name.split('.').pop(); // .jpg, .png va h.k.
            const imagePath = `/public/news/${md5(files.image.name + new Date())}.${imageExtension}`;

            // 4. Ma'lumotlarni bazaga yozish (fayl yo'li bilan birga)
            const newNews = new News({
                title,
                category,
                date: date || Date.now(), // Agar sana kelmasa, hozirgi vaqt qo'yiladi
                content,
                image: imagePath // Serverdagi fayl yo'li saqlanadi
            });

            // Bazaga saqlaymiz
            const savedNews = await newNews.save();

            // 5. Rasm faylini haqiqatda server xotirasiga ko'chirish (.mv() orqali)
            await files.image.mv(`.${imagePath}`);



            return res.send({
                ok: true,
                msg: "Yangilik muvaffaqiyatli qo'shildi va rasm serverga yuklandi!",
                data: savedNews
            });

        } catch (err) {
            console.error("Xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Yangilikni saqlashda kutilmagan xatolik yuz berdi."
            });
        }
    },
    getAll: async (req, res) => {
        try {
            // 1. Bazadan barcha yangiliklarni sanasi bo'yicha kamayish tartibida olish
            // sort({ date: -1 }) -> eng yangi qo'shilgan yangiliklar ro'yxatning tepasida turadi
            const allNews = await News.find().sort({ date: -1 });

            // 2. Agar bazada umuman yangilik bo'lmasa
            if (!allNews || allNews.length === 0) {
                return res.send({
                    ok: true,
                    msg: "Hozircha hech qanday yangilik mavjud emas.",
                    data: []
                });
            }

            // 3. Ma'lumotlar muvaffaqiyatli topilganda javob qaytarish
            return res.send({
                ok: true,
                msg: "Barcha yangiliklar muvaffaqiyatli yuklandi!",
                count: allNews.length, // Jami yangiliklar soni (front-end uchun foydali)
                data: allNews
            });

        } catch (err) {
            // 4. Kutilmagan xatoliklarni ushlash
            console.error("getAll Controllerda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Yangiliklarni yuklashda kutilmagan xatolik yuz berdi."
            });
        }
    },
    edit: async (req, res) => {
        try {
            const { id } = req.params; // Tahrirlanadigan yangilik ID si URL dan olinadi (/api/news/:id)
            const { title, category, date, content } = req.body;
            const files = req.files;

            // 1. Yangilik bazada borligini tekshiramiz
            const existingNews = await News.findById(id);
            if (!existingNews) {
                return res.send({
                    ok: false,
                    msg: "Tahrirlanadigan yangilik topilmadi!"
                });
            }

            // 2. Majburiy matnli maydonlarni tekshirish
            if (!title || !category || !content) {
                return res.send({
                    ok: false,
                    msg: "Iltimos, barcha majburiy matnli maydonlarni doldiring (title, category, content)!"
                });
            }

            // Default holatda eski rasm yo'lini saqlab turamiz
            let imagePath = existingNews.image;

            // 3. Agar yangi rasm yuklangan bo'lsa
            if (files && files.image) {

                // Eski rasm fayli serverda mavjud bo'lsa, uni o'chirib tashlaymiz
                if (existingNews.image && fs.existsSync(`.${existingNews.image}`)) {
                    fs.unlinkSync(`.${existingNews.image}`);
                }

                // Yangi rasm uchun papka tekshiruvi
                const dirPath = './public/news';
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }

                // Yangi rasmga unikal nom berish
                const imageExtension = files.image.name.split('.').pop();
                imagePath = `/public/news/${md5(files.image.name + new Date())}.${imageExtension}`;

                // Yangi rasm faylini serverga yuklash
                await files.image.mv(`.${imagePath}`);
            }

            // 4. Bazadagi ma'lumotlarni yangilash
            existingNews.title = title;
            existingNews.category = category;
            existingNews.content = content;
            existingNews.image = imagePath; // Yangi yoki eski rasm yo'li
            if (date) existingNews.date = date; // Agar yangi sana berilgan bo'lsa

            const updatedNews = await existingNews.save();

            return res.send({
                ok: true,
                msg: "Yangilik muvaffaqiyatli tahrirlandi!",
                data: updatedNews
            });

        } catch (err) {
            console.error("edit Controllerda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Yangilikni tahrirlashda kutilmagan xatolik yuz berdi."
            });
        }
    },
    delete: async (req, res) => {
        try {
            const { id } = req.params; // O'chirilishi kerak bo'lgan yangilik ID si (/api/news/:id)

            // 1. Yangilik bazada borligini tekshiramiz
            const existingNews = await News.findById(id);
            if (!existingNews) {
                return res.send({
                    ok: false,
                    msg: "O'chirilishi kerak bo'lgan yangilik topilmadi!"
                });
            }

            // 2. Yangilikka biriktirilgan rasm faylini server xotirasidan o'chirish
            if (existingNews.image && fs.existsSync(`.${existingNews.image}`)) {
                try {
                    fs.unlinkSync(`.${existingNews.image}`);
                } catch (fileErr) {
                    // Fayl o'chishida xatolik bo'lsa, konsolga yozamiz lekin jarayonni to'xtatmaymiz
                    console.error("Faylni o'chirishda xatolik yuz berdi:", fileErr.message);
                }
            }

            // 3. Yangilikni ma'lumotlar bazasidan o'chirish
            await News.findByIdAndDelete(id);

            return res.send({
                ok: true,
                msg: "Yangilik va unga tegishli rasm fayli muvaffaqiyatli o'chirildi!"
            });

        } catch (err) {
            console.error("delete Controllerda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Yangilikni o'chirishda kutilmagan xatolik yuz berdi."
            });
        }
    }
}