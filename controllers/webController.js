const Rahbariyat = require('../models/peopleModel'); // Model joylashgan yo'lni to'g'rilab qo'ying
const fs = require('fs');
const md5 = require('md5');

module.exports = {
    addPeople: async (req, res) => {
        try {
            // Matnli ma'lumotlar req.body ichida keladi
            const { name, category, position } = req.body;

            // Fayllar req.files ichida keladi
            const files = req.files;

            // 1. Majburiy matnli maydonlarni tekshirish
            if (!name || !category || !position) {
                return res.send({
                    ok: false,
                    msg: "Iltimos, barcha majburiy matnli maydonlarni (ism, kategoriya, lavozim) to'ldiring!"
                });
            }

            // 2. Rasm yuklanganini tekshirish
            if (!files || !files.photo) {
                return res.send({
                    ok: false,
                    msg: "Iltimos, rahbariyat a'zosining rasmini yuklang!"
                });
            }

            // Papka mavjudligini tekshirish, bo'lmasa yaratish
            const dirPath = './public/rahbariyat';
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            // Rasm uchun unikal nom va saqlash yo'lini yaratish
            const extension = files.photo.name.split('.').pop(); // fayl kengaytmasini olish (jpg, png va h.k.)
            const photoPath = `/public/rahbariyat/${md5(files.photo.name + new Date())}.${extension}`;

            // 3. Ma'lumotlarni bazaga yozish
            const newLeader = new Rahbariyat({
                name,
                category,
                position,
                photo: photoPath
            });

            // Bazaga saqlaymiz
            await newLeader.save();

            // 4. Rasmni haqiqatda server xotirasiga ko'chirish (.mv() orqali)
            await files.photo.mv(`.${photoPath}`);

            return res.send({
                ok: true,
                msg: "Rahbariyat a'zosi muvaffaqiyatli qo'shildi!"
            });

        } catch (err) {
            console.error("Xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Ma'lumotni saqlashda kutilmagan xatolik yuz berdi."
            });
        }
    },
    changePeople: async ( req, res) => {
        try {
            // ID har doim majburiy, qolgan maydonlar ixtiyoriy
            const { id, name, category, position } = req.body;
            const files = req.files;

            // 1. ID kelganini tekshirish
            if (!id) {
                return res.send({
                    ok: false,
                    msg: "O'zgartirish uchun rahbariyat a'zosining ID raqami (id) majburiy!"
                });
            }

            // 2. Bazadan ushbu odamni topamiz
            const existingLeader = await Rahbariyat.findById(id);
            if (!existingLeader) {
                return res.send({
                    ok: false,
                    msg: "Ushbu ID ga ega rahbariyat a'zosi topilmadi!"
                });
            }

            // Faqat kelgan ma'lumotlarni yig'ish uchun bo'sh obyekt ochamiz
            let updateData = {};

            // 3. Matnli maydonlarni dinamik tekshirish (faqat kelganlarini qo'shamiz)
            if (name !== undefined && name.trim() !== "") updateData.name = name;
            if (category !== undefined && category.trim() !== "") updateData.category = category;
            if (position !== undefined && position.trim() !== "") updateData.position = position;

            let newPhotoPath = null;

            // 4. Rasm kelganligini tekshirish
            if (files && files.photo) {
                const dirPath = './public/rahbariyat';
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }

                // Yangi rasm uchun nom yaratish
                const extension = files.photo.name.split('.').pop();
                newPhotoPath = `/public/rahbariyat/${md5(files.photo.name + new Date())}.${extension}`;
                
                // Yangilanadigan obyektga rasmni qo'shamiz
                updateData.photo = newPhotoPath;
            }

            // 5. Agar body'da ham, files'da ham hech narsa kelmagan bo'lsa, bazaga murojaat qilib o'tirmaymiz
            if (Object.keys(updateData).length === 0) {
                return res.send({
                    ok: false,
                    msg: "Hech qanday o'zgarish kiritilmadi (ma'lumotlar yuborilmadi)!"
                });
            }

            // 6. Bazani faqat kelgan ma'lumotlar (updateData) bilan yangilaymiz
            await Rahbariyat.findByIdAndUpdate(id, updateData);

            // 7. Agar rasm yangilangan bo'lsa, fayllar bilan ishlaymiz
            if (newPhotoPath) {
                // Yangisini saqlaymiz
                await files.photo.mv(`.${newPhotoPath}`);

                // Eskisini o'chiramiz
                if (existingLeader.photo && fs.existsSync(`.${existingLeader.photo}`)) {
                    fs.unlinkSync(`.${existingLeader.photo}`);
                }
            }

            return res.send({
                ok: true,
                msg: "Ma'lumotlar muvaffaqiyatli o'zgartirildi!"
            });

        } catch (err) {
            console.error("Xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Ma'lumotni o'zgartirishda kutilmagan xatolik yuz berdi."
            });
        }
    },
    getAll: async (req, res) => {
        try {
            // URL orqali kategoriya bo'yicha filter kelgan bo'lsa uni olamiz (ixtiyoriy)
            // Masalan: /api/rahbariyat?category=rektorat
            const { category } = req.query;

            // Qidiruv filtri uchun bo'sh obyekt ochamiz
            let filter = {};

            // Agar frontenddan kategoriya yuborilgan bo'lsa, uni filtrga qo'shamiz
            if (category) {
                filter.category = category;
            }

            // Bazadan filtri bo'yicha (yoki hamma) ma'lumotlarni qidiramiz
            // .sort({ _id: -1 }) — oxirgi qo'shilganlarni birinchi ko'rsatadi
            const leaders = await Rahbariyat.find(filter).sort({ _id: -1 });

            // Agar baza bo'sh bo'lsa ham bo'sh massiv [] qaytadi
            return res.send({
                ok: true,
                count: leaders.length, // Jami nechta ma'lumot qaytayotgani bilish uchun
                data: leaders
            });

        } catch (err) {
            console.error("Xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Ma'lumotlarni yuklashda kutilmagan xatolik yuz berdi."
            });
        }
    },
    deletePeople: async (req, res) => {
        try {
            // O'chirilishi kerak bo'lgan a'zoning ID raqami
            const { id } = req.body;

            // 1. ID kelganini tekshirish
            if (!id) {
                return res.send({
                    ok: false,
                    msg: "O'chirish uchun rahbariyat a'zosining ID raqami (id) majburiy!"
                });
            }

            // 2. Bazadan ushbu odamni qidirib topamiz (rasmini o'chirish uchun ma'lumoti kerak)
            const existingLeader = await Rahbariyat.findById(id);
            if (!existingLeader) {
                return res.send({
                    ok: false,
                    msg: "O'chirilishi kerak bo'lgan rahbariyat a'zosi bazadan topilmadi!"
                });
            }

            // 3. Bazadan ma'lumotni o'chiramiz
            await Rahbariyat.findByIdAndDelete(id);

            // 4. Baza muvaffaqiyatli o'chirilgach, uning rasmini server xotirasidan ham o'chiramiz
            if (existingLeader.photo && fs.existsSync(`.${existingLeader.photo}`)) {
                fs.unlinkSync(`.${existingLeader.photo}`);
            }

            return res.send({
                ok: true,
                msg: `${existingLeader.name} muvaffaqiyatli o'chirib tashlandi!`
            });

        } catch (err) {
            console.error("Xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Ma'lumotni o'chirishda kutilmagan xatolik yuz berdi."
            });
        }
    }
};