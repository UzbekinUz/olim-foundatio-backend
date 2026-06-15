const applicationModel = require("../models/applicationModel");
const { JWT } = require("google-auth-library");
const { GoogleSpreadsheet } = require("google-spreadsheet");

// Google Sheets fayliga yangi qator qo'shish funksiyasi
async function addToGoogleSheet(username, password) {
    try {
        // 1. .env fayldan Google API kalitlari bilan tizimga kirish
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // \n belgilari buzilmasligi uchun
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // 2. Google Sheet faylini yuklash
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo(); 

        // 3. Birinchi varaqni (Sheet 1) tanlash
        const sheet = doc.sheetsByIndex[0]; 

        // 4. Jadvalga yangi qator qo'shish
        // Kalit nomlari Google Sheet'dagi birinchi qator (A1, B1, C1) sarlavhalariga to'liq mos kelishi shart!
        await sheet.addRow({
            Username: username,
            Password: password,
            Date: new Date().toLocaleString() // Hozirgi sana va vaqtni qo'shib qo'yamiz
        });
        
        console.log("Ma'lumot Google Sheetga muvaffaqiyatli yozildi!");
    } catch (sheetError) {
        // Google Sheets xatoligini alohida konsolga chiqarish (baza ishlab tursada, sheet xatosini bilish uchun)
        console.error("Google Sheets'ga yozishda xatolik:", sheetError.message);
    }
}

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

            // B. MongoDB'ga muvaffaqiyatli saqlangach, avtomatik Google Sheetga ham yuboramiz
            await addToGoogleSheet(username, password);

            return res.send({
                ok: true,
                msg: "Muvaffaqiyatli qo'shildi (Baza va Google Sheetga)"
            });

        } catch (err) {
            console.error(err);
            return res.send({
                ok: false,
                msg: "Xatolik yuz berdi"
            });
        }
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