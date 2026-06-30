const md5 = require('md5');
const ChioClientModel = require('../models/chio/clientModel'); // Model joylashgan yo'lni o'zingizniki bilan almashtiring
const fs = require('fs');
const ChioBarberModel = require('../models/chio/barberModel')
const ChioServiceModel = require('../models/chio/serviceModel')
const ChioTableModel = require('../models/chio/tableModel')
const ChioOrderModel = require('../models/chio/orderModel')



module.exports = {
    // Clientlar uchun
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
            const token = require('jsonwebtoken').sign({ clientId: $user._id }, process.env.JWT_USER_SECRET, { expiresIn: '1d' });
            $user.set({ access_token: token }).save();
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
    },
    

    // Barber uchun

    addBarber: async (req, res) => {
        try {
            // Matnli ma'lumotlar req.body ichida keladi
            const { name, phone, date, password } = req.body;

            // Fayllar req.files ichida keladi
            const files = req.files;

            // Majburiy matnli maydonlarni tekshirish
            if (!name || !phone) {
                return res.send({
                    ok: false,
                    msg: "Iltimos, majburiy maydonlarni (ism va telefon) to'ldiring!"
                });
            }

            // Takroriy sartaroshni tekshirish
            const existingBarber = await ChioBarberModel.findOne({ phone });
            if (existingBarber) {
                return res.send({
                    ok: false,
                    msg: "Bu telefon raqami bilan allaqachon sartarosh ro'yxatdan o'tgan!"
                });
            }

            // Majburiy rasm fayli kelganini tekshirish
            if (!files || !files.photo) {
                return res.send({
                    ok: false,
                    msg: "Iltimos, sartarosh uchun rasm (photo) yuklang!"
                });
            }

            // Fayllar saqlanadigan papka mavjudligini tekshirish, bo'lmasa yaratish
            const dirPath = './public/barbers';
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            // Rasm fayli uchun unikal nom va yo'l yaratish
            const imageExtension = files.photo.name.split('.').pop(); // .jpg, .png va h.k.
            const imagePath = `/public/barbers/${md5(files.photo.name + new Date())}.${imageExtension}`;

            // Yangi sartarosh obyektini yaratish
            const newBarber = new ChioBarberModel({
                name,
                phone,
                photo: imagePath, // Rasm yo'li saqlanadi
                date: date || new Date().toISOString(),
                password
            });

            // Bazaga saqlaymiz
            const savedBarber = await newBarber.save();

            // Rasm faylini haqiqatda server xotirasiga ko'chirish
            await files.photo.mv(`.${imagePath}`);

            return res.send({
                ok: true,
                msg: "Sartarosh muvaffaqiyatli qo'shildi va rasm yuklandi!",
                data: savedBarber
            });

        } catch (err) {
            console.error("Sartarosh qo'shishda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Sartaroshni saqlashda kutilmagan xatolik yuz berdi."
            });
        }
    },
   editBarber: async (req, res) => {
        try {
            // newpassword ham req.body ichidan ajratib olindi
            const { _id, name, phone, orders, date, password, newpassword, table, rank } = req.body;
            const files = req.files;

            if (!_id) {
                return res.send({
                    ok: false,
                    msg: "Sartaroshni yangilash uchun '_id' yuborilishi shart!"
                });
            }

            // Sartaroshni tekshirishlar va parolni solishtirish uchun avvaldan topib olamiz
            const currentBarber = await ChioBarberModel.findById(_id);
            if (!currentBarber) {
                return res.send({
                    ok: false,
                    msg: "Sartarosh topilmadi!"
                });
            }

            // Telefon bandligini tekshirish
            if (phone) {
                const phoneCheck = await ChioBarberModel.findOne({ phone, _id: { $ne: _id } });
                if (phoneCheck) {
                    return res.send({
                        ok: false,
                        msg: "Bu telefon raqami allaqachon boshqa sartaroshga biriktirilgan!"
                    });
                }
            }

            // Dinamik yangilanadigan maydonlar obyekti
            const updateFields = {};
            if (name !== undefined) updateFields.name = name;
            if (phone !== undefined) updateFields.phone = phone;
            if (date !== undefined) updateFields.date = date;
            if (table !== undefined) updateFields.table = table;
            if (rank !== undefined) updateFields.rank = rank;

            // PAROLNI TEKSHIRISH VA O'ZGARTIRISH LOGIKASI
            if (newpassword !== undefined && newpassword.trim() !== "") {
                // Agar yangi parol yuborilgan bo'lsa, eski (joriy) parol ham kelishi shart
                if (!password || password.trim() === "") {
                    return res.send({
                        ok: false,
                        msg: "Parolni o'zgartirish uchun amaldagi (eski) parolni kiritishingiz kerak!"
                    });
                }

                // Agar parollaringiz shifrlangan bo'lsa (masalan bcrypt), bu yerda solishtirish funksiyasi o'zgaradi.
                // Hozirgi kodingizga asosan to'g'ridan-to'g'ri (string) solishtiramiz:
                if (currentBarber.password !== password) {
                    return res.send({
                        ok: false,
                        msg: "Amaldagi parol noto'g'ri kiritildi!"
                    });
                }

                // Agar eski parol to'g'ri bo'lsa, yangisini bazaga saqlash uchun tayyorlaymiz
                updateFields.password = newpassword;
            }

            if (orders !== undefined) {
                if (typeof orders === 'string' && orders.trim() !== '') {
                    try { updateFields.orders = JSON.parse(orders); } catch (e) { }
                } else {
                    updateFields.orders = orders;
                }
            }

            // AGAR YANGI RASM YUKLANGAN BO'LSA
            let oldImagePath = null;
            if (files && files.photo) {
                // Rasm o'chirish logikasi uchun yuqorida topilgan currentBarber'dan foydalanamiz
                if (currentBarber.photo) {
                    oldImagePath = currentBarber.photo;
                }

                // Yangi rasm uchun yo'l yaratamiz
                const dirPath = './public/barbers';
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
                const imageExtension = files.photo.name.split('.').pop();
                const newImagePath = `/public/barbers/${md5(files.photo.name + new Date())}.${imageExtension}`;
                
                // Yangilanishi kerak bo'lgan maydonlar ro'yxatiga yangi rasm yo'lini qo'shamiz
                updateFields.photo = newImagePath;

                // Yangi rasm faylini yuklaymiz
                await files.photo.mv(`.${newImagePath}`);

                // Yangi rasm muvaffaqiyatli yuklansa va eski rasm mavjud bo'lsa, eskisini o'chiramiz
                if (oldImagePath && fs.existsSync(`.${oldImagePath}`)) {
                    fs.unlinkSync(`.${oldImagePath}`);
                }
            }

            // BAZADA MA'LUMOTLARNI YANGILASH
            const updatedBarber = await ChioBarberModel.findByIdAndUpdate(
                _id,
                { $set: updateFields },
                { returnDocument: 'after' }
            );

            return res.send({
                ok: true,
                msg: "Sartarosh ma'lumotlari muvaffaqiyatli yangilandi!",
                data: updatedBarber
            });

        } catch (err) {
            console.error("Sartarosh tahrirlashda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Yangilashda kutilmagan xatolik yuz berdi."
            });
        }
    },
    signinB: async (req, res) => {
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
            const $user = await ChioBarberModel.findOne({ phone });

            if (!$user) {
                console.log(phone);
                
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
            const token = require('jsonwebtoken').sign({ id: $user._id }, process.env.JWT_USER_SECRET, { expiresIn: '1d' });
            $user.set({ access_token: token }).save();
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
    checkB: async function (req, res) {
        res.send({
            ok: true,
            barberInfo: req.user
        });
    },
    leaveB: async (req, res) => {
        const { id } = req.user;
        const $user = await ChioBarberModel.findOne({ _id: id });
        $user.set({ access_token: 'none' }).save();

        res.send({
            ok: true,
            msg: "Profildan chiqish amalga oshdi!"
        });
    },
    getAllB: async (req, res) => {
        try {
            const users = await ChioBarberModel.find();
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

    // Service uchun

    addService: async (req, res) => {
        try {
            const { title, price, status, timeTakes } = req.body;

            // Majburiy maydonlarni tekshirish (Nomi, narxi va qancha vaqt ketishi shart)
            if (!title || !price || !timeTakes) {
                return res.send({
                    ok: false,
                    msg: "Iltimos, barcha majburiy maydonlarni (title, price, timeTakes) to'ldiring!"
                });
            }

            // Bir xil nomli xizmat qayta qo'shilmasligini tekshirish
            const existingService = await ChioServiceModel.findOne({ title });
            if (existingService) {
                return res.send({
                    ok: false,
                    msg: "Bu nomdagi xizmat allaqachon mavjud!"
                });
            }

            // Yangi xizmat obyektini yaratish
            const newService = new ChioServiceModel({
                title,
                price,
                status: status !== undefined ? status : "true", // Agar kelmasa, model bo'yicha "true" string bo'ladi
                timeTakes // Masalan: "30", "45" daqiqa hisobida
            });

            const savedService = await newService.save();

            return res.send({
                ok: true,
                msg: "Xizmat muvaffaqiyatli qo'shildi!",
                data: savedService
            });

        } catch (err) {
            console.error("Xizmat qo'shishda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Xizmatni saqlashda kutilmagan xatolik yuz berdi."
            });
        }
    },
    editService: async (req, res) => {
        try {
            const { _id, title, price, status, timeTakes } = req.body;

            // ID kelganini tekshirish
            if (!_id) {
                return res.send({
                    ok: false,
                    msg: "Xizmatni yangilash uchun uning '_id' qiymati yuborilishi shart!"
                });
            }

            // Agar xizmat nomi o'zgartirilayotgan bo'lsa, u boshqa xizmatda band emasligini tekshirish
            if (title) {
                const titleCheck = await ChioServiceModel.findOne({ title, _id: { $ne: _id } });
                if (titleCheck) {
                    return res.send({
                        ok: false,
                        msg: "Bu nomdagi xizmat allaqachon mavjud, boshqa nom tanlang!"
                    });
                }
            }

            // Faqat kelgan (frontend yuborgan) maydonlarni dinamik yangilash
            const updateFields = {};
            if (title !== undefined) updateFields.title = title;
            if (price !== undefined) updateFields.price = price;
            if (status !== undefined) updateFields.status = status;
            if (timeTakes !== undefined) updateFields.timeTakes = timeTakes;

            const updatedService = await ChioServiceModel.findByIdAndUpdate(
                _id,
                { $set: updateFields },
                { new: true } // Yangilangan yangi ma'lumotni qaytaradi
            );

            if (!updatedService) {
                return res.send({
                    ok: false,
                    msg: "Xizmat topilmadi!"
                });
            }

            return res.send({
                ok: true,
                msg: "Xizmat ma'lumotlari muvaffaqiyatli yangilandi!",
                data: updatedService
            });

        } catch (err) {
            console.error("Xizmatni tahrirlashda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Xizmatni yangilashda kutilmagan xatolik yuz berdi."
            });
        }
    },
    getAllServices: async (req, res) => {
        try {
            const services = await ChioServiceModel.find({});
            
            return res.send({
                ok: true,
                msg: "Barcha xizmatlar muvaffaqiyatli yuklandi!",
                data: services
            });
        } catch (err) {
            console.error("Xizmatlarni olishda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi."
            });
        }
    },
    deleteService: async (req, res) => {
        try {
            const { _id } = req.body;

            if (!_id) {
                return res.send({
                    ok: false,
                    msg: "O'chirish uchun '_id' yuborilishi shart!"
                });
            }

            const deletedService = await ChioServiceModel.findByIdAndDelete(_id);

            if (!deletedService) {
                return res.send({
                    ok: false,
                    msg: "Xizmat topilmadi yoki allaqachon o'chirilgan!"
                });
            }

            return res.send({
                ok: true,
                msg: "Xizmat muvaffaqiyatli o'chirildi!"
            });

        } catch (err) {
            console.error("Xizmatni o'chirishda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Xizmatni o'chirishda kutilmagan xatolik yuz berdi."
            });
        }
    },

    // Orderlar uchun

    addOrder: async (req, res) => {
    try {
        const { clientId, barberId, servicesId, appointmentDate, status } = req.body;

        // Majburiy maydonlarni tekshirish (totalPrice olib tashlandi, chunki uni o'zimiz hisoblaymiz)
        if (!clientId || !barberId || !appointmentDate) {
            return res.send({
                ok: false,
                msg: "Iltimos, barcha majburiy maydonlarni to'ldiring (clientId, barberId, appointmentDate)!"
            });
        }

        // servicesId massivini tekshirish va parslash (agar string bo'lib kelsa)
        let parsedServices = servicesId;
        if (typeof servicesId === 'string' && servicesId.trim() !== '') {
            try {
                parsedServices = JSON.parse(servicesId);
            } catch (e) {
                parsedServices = [];
            }
        }

        if (!Array.isArray(parsedServices) || parsedServices.length === 0) {
            return res.send({
                ok: false,
                msg: "Iltimos, kamida bitta xizmat (servicesId) tanlang!"
            });
        }

        // --- DINAMIK VAQT VA NARXNI HISOBLASH ---
        // Tanlangan barcha xizmatlarni bazadan bir marta tortib olamiz
        const dbServices = await ChioServiceModel.find({ _id: { $in: parsedServices } });
        
        let totalDuration = 0;
        let calculatedTotalPrice = 0;

        dbServices.forEach(service => {
            // Har bir xizmatning timeTakes qiymatini raqamga o'girib umumiy vaqtga qo'shamiz
            const duration = parseInt(service.timeTakes) || 0;
            totalDuration += duration;

            // Har bir xizmatning price qiymatini raqamga o'girib jami narxga qo'shamiz
            const price = parseFloat(service.price) || 0;
            calculatedTotalPrice += price;
        });
        // ------------------------------------

        // Yangi buyurtma obyektini yaratish
        const newOrder = new ChioOrderModel({
            clientId,
            barberId,
            servicesId: parsedServices,
            totalPrice: calculatedTotalPrice, // Dinamik hisoblangan narx
            appointmentDate,
            status: status || 'pending',
            timeTakes: totalDuration.toString() // Hisoblangan jami vaqt (Masalan: "75")
        });

        const savedOrder = await newOrder.save();

        return res.send({
            ok: true,
            msg: "Buyurtma muvaffaqiyatli yaratildi, jami vaqt va narx hisoblandi!",
            data: savedOrder
        });

    } catch (err) {
        console.error("Buyurtma yaratishda xatolik:", err);
        return res.send({
            ok: false,
            msg: err.message || "Buyurtmani saqlashda kutilmagan xatolik yuz berdi."
        });
    }
},

    // 2. BARCHA BUYURTMALARNI OLISH (getAllOrders)
    getAllOrders: async (req, res) => {
        try {
            const orders = await ChioOrderModel.find({}).sort({ createdAt: -1 });

            return res.send({
                ok: true,
                msg: "Barcha buyurtmalar muvaffaqiyatli yuklandi!",
                data: orders
            });
        } catch (err) {
            console.error("Buyurtmalarni olishda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi."
            });
        }
    },

    // 3. BITTA BUYURTMANI ID ORQALI OLISH (getOneOrder)
    getOneOrder: async (req, res) => {
        try {
            const { _id } = req.body;

            if (!_id) {
                return res.send({
                    ok: false,
                    msg: "Buyurtmani ko'rish uchun '_id' yuborilishi shart!"
                });
            }

            const order = await ChioOrderModel.findById(_id);

            if (!order) {
                return res.send({
                    ok: false,
                    msg: "Bunday IDga ega buyurtma topilmadi!"
                });
            }

            return res.send({
                ok: true,
                msg: "Buyurtma muvaffaqiyatli topildi!",
                data: order
            });

        } catch (err) {
            console.error("Buyurtmani olishda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Kutilmagan xatolik yuz berdi."
            });
        }
    },
    getOrderByClient: async (req, res) => {
        try {
            const { clientId } = req.params;

            // 1. Mijoz ID'si borligini tekshirish
            if (!clientId) {
                return res.send({
                    ok: false,
                    msg: "Mijoz ID'si yuborilishi shart!"
                });
            }

            // 2. Buyurtmalarni qidirish va bog'liq ma'lumotlarni to'ldirish (populate)
            // .populate('barberId') va .populate('servicesId')
            // Eslatma: Modelingizdagi ref nomlariga moslang (barberId yoki servicesId)
            const orders = await ChioOrderModel.find({ clientId: clientId })
                .populate('barberId') 
                .populate('servicesId')
                .sort({ createdAt: -1 });

            if (!orders || orders.length === 0) {
                return res.send({
                    ok: true,
                    msg: "Ushbu mijozda hali buyurtmalar mavjud emas.",
                    data: []
                });
            }

            // 3. Frontend uchun sanalarni chiroyli formatlash
            const formattedOrders = orders.map(order => ({
                ...order._doc,
                appointmentDate: new Date(order.appointmentDate).toLocaleString('uz-UZ', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                createdAt: new Date(order.createdAt).toLocaleString('uz-UZ', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                })
            }));

            // 4. Muvaffaqiyatli javob
            return res.send({
                ok: true,
                msg: "Mijozning barcha buyurtmalari muvaffaqiyatli yuklandi!",
                data: formattedOrders
            });

        } catch (err) {
            console.error("Mijoz buyurtmalarini olishda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Ma'lumotlarni yuklashda kutilmagan xatolik yuz berdi."
            });
        }
    },
    getOrderByBarber: async (req, res) => {
        try {
            const { clientId } = req.params;

            // 1. Mijoz ID'si borligini tekshirish
            if (!clientId) {
                return res.send({
                    ok: false,
                    msg: "Mijoz ID'si yuborilishi shart!"
                });
            }

            // 2. Buyurtmalarni qidirish va bog'liq ma'lumotlarni to'ldirish (populate)
            // .populate('barberId') va .populate('servicesId')
            // Eslatma: Modelingizdagi ref nomlariga moslang (barberId yoki servicesId)
            const orders = await ChioOrderModel.find({ barberId: clientId })
                .populate('clientId') 
                .populate('servicesId')
                .sort({ createdAt: -1 });

            if (!orders || orders.length === 0) {
                return res.send({
                    ok: true,
                    msg: "Ushbu mijozda hali buyurtmalar mavjud emas.",
                    data: []
                });
            }

            // 3. Frontend uchun sanalarni chiroyli formatlash
            const formattedOrders = orders.map(order => ({
                ...order._doc,
                appointmentDate: new Date(order.appointmentDate).toLocaleString('uz-UZ', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                createdAt: new Date(order.createdAt).toLocaleString('uz-UZ', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                })
            }));

            // 4. Muvaffaqiyatli javob
            return res.send({
                ok: true,
                msg: "Mijozning barcha buyurtmalari muvaffaqiyatli yuklandi!",
                data: formattedOrders
            });

        } catch (err) {
            console.error("Mijoz buyurtmalarini olishda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Ma'lumotlarni yuklashda kutilmagan xatolik yuz berdi."
            });
        }
    },

    // 4. BUYURTMANI O'CHIRISH (deleteOrder)
    deleteOrder: async (req, res) => {
        try {
            const { _id } = req.body;

            if (!_id) {
                return res.send({
                    ok: false,
                    msg: "O'chirish uchun '_id' yuborilishi shart!"
                });
            }

            const deletedOrder = await ChioOrderModel.findByIdAndDelete(_id);

            if (!deletedOrder) {
                return res.send({
                    ok: false,
                    msg: "Buyurtma topilmadi yoki allaqachon o'chirilgan!"
                });
            }

            return res.send({
                ok: true,
                msg: "Buyurtma muvaffaqiyatli o'chirildi!"
            });

        } catch (err) {
            console.error("Buyurtmani o'chirishda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "O'chirishda kutilmagan xatolik yuz berdi."
            });
        }
    },
    

    // 5. STATUSNI O'ZGARTIRISH VA SARTAROSHGA TARIX QILIB QO'SHISH (changeStatus)
    changeStatus: async (req, res) => {
        try {
            const { _id, status } = req.body;

            if (!_id || !status) {
                return res.send({
                    ok: false,
                    msg: "Iltimos, '_id' va yangi 'status' qiymatlarini yuboring!"
                });
            }

            const updatedOrder = await ChioOrderModel.findByIdAndUpdate(
                _id,
                { $set: { status } },
                { new: true }
            );

            if (!updatedOrder) {
                return res.send({
                    ok: false,
                    msg: "Buyurtma topilmadi!"
                });
            }

            // Agar buyurtma 'completed' bo'lsa, sartaroshning 'orders' massiviga qo'shamiz
            if (status === 'completed' && updatedOrder.barberId) {
                await ChioBarberModel.findByIdAndUpdate(
                    updatedOrder.barberId,
                    { $addToSet: { orders: updatedOrder._id } }
                );
            }

            return res.send({
                ok: true,
                msg: `Buyurtma holati '${status}'ga o'zgartirildi!`,
                data: updatedOrder
            });

        } catch (err) {
            console.error("Statusni o'zgartirishda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Statusni yangilashda kutilmagan xatolik yuz berdi."
            });
        }
    },

    //Mayda chuyda

    getAvailableSlots: async (req, res) => {
        try {
            // Frontenddan faqat stol IDsi va jami ketadigan vaqt (daqiqada) keladi
            const { barberId, timeTakes } = req.body;
            
            if (!barberId || !timeTakes) {
                return res.send({
                    ok: false,
                    msg: "Iltimah, 'barberId' va jami 'timeTakes' (daqiqa) qiymatlarini yuboring!"
                });
            }

            // Kelgan timeTakes qiymatini raqamga o'giramiz (masalan: "75" -> 75)
            const totalDuration = parseInt(timeTakes) || 45;

            // 1. Kelgusi 3 kunlik vaqt oralig'ini aniqlaymiz (Bugundan boshlab)
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Bugun soat 00:00
            
            const threeDaysLater = new Date(today);
            threeDaysLater.setDate(threeDaysLater.getDate() + 3); // Indindan keyingi kun 00:00

            // 2. Ushbu stolda keyingi 3 kunda mavjud bo'lgan barcha aktiv band orderlarni olamiz
            const existingOrders = await ChioOrderModel.find({
                barberId,
                status: { $in: ['pending', 'progress'] },
                appointmentDate: {
                    $gte: today.toISOString(),
                    $lte: threeDaysLater.toISOString()
                }
            });

            // 3. Salonning ish vaqti sozlamalari (09:00 dan 21:00 gacha)
            const START_HOUR = 9;
            const END_HOUR = 21;
            const TIME_STEP = 30; // Har 30 daqiqada yangi slot yaratib tekshiriladi

            const result = [];

            // Kelgusi 3 kunni birma-bir aylanamiz
            for (let i = 0; i < 3; i++) {
                const currentDay = new Date(today);
                currentDay.setDate(currentDay.getDate() + i);

                // Kun nomini chiroyli formatlash (Masalan: "Dushanba, 26-iyun")
                const dayString = currentDay.toLocaleDateString('uz-UZ', { weekday: 'long', month: 'long', day: 'numeric' });
                const daySlots = [];

                // Tekshirishni soat 09:00 dan boshlaymiz
                let slotTime = new Date(currentDay);
                slotTime.setHours(START_HOUR, 0, 0, 0);

                // Ish vaqti tugash chegarasi
                const endSelectionTime = new Date(currentDay);
                endSelectionTime.setHours(END_HOUR, 0, 0, 0);

                // Soatbay aylanamiz
                while (slotTime < endSelectionTime) {
                    
                    // Agar tekshirilayotgan soat/daqiqa hozirgi vaqtdan o'tib ketgan bo'lsa, uni tashlab ketamiz
                    if (slotTime < new Date()) {
                        slotTime = new Date(slotTime.getTime() + TIME_STEP * 60000);
                        continue;
                    }

                    const slotStart = slotTime.getTime();
                    const slotEnd = slotStart + totalDuration * 60000; // Biz so'ragan xizmat tugaydigan vaqt

                    let isConflict = false;

                    // Ushbu 30 daqiqalik oraliq bazadagi orderlarga xalaqit beryaptimi?
                    for (const order of existingOrders) {
                        const orderStart = new Date(order.appointmentDate).getTime();
                        const orderDuration = parseInt(order.timeTakes) || 45;
                        const orderEnd = orderStart + orderDuration * 60000;

                        // To'qnashuvni tekshirish (Overlap mantiqi)
                        if (slotStart < orderEnd && slotEnd > orderStart) {
                            isConflict = true;
                            break; 
                        }
                    }

                    // Agar hech qaysi buyurtma bilan urilib ketmasa, ro'yxatga qo'shamiz
                    if (!isConflict) {
                        const timeString = slotTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
                        daySlots.push({
                            time: timeString,
                            fullIsoDate: slotTime.toISOString()
                        });
                    }

                    // Keyingi 30 daqiqaga o'tamiz
                    slotTime = new Date(slotTime.getTime() + TIME_STEP * 60000);
                }

                // Kunlik natijani yig'amiz
                result.push({
                    day: dayString,
                    date: currentDay.toISOString().split('T')[0],
                    slots: daySlots
                });
            }

            return res.send({
                ok: true,
                msg: "Bo'sh vaqtlar muvaffaqiyatli aniqlandi!",
                data: result
            });

        } catch (err) {
            console.error("Vaqtlarni hisoblashda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Kutilmagan server xatoligi."
            });
        }
    }

};