const Application = require("../models/applyModel.js");
const { JWT } = require("google-auth-library");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const path = require('path')
process.env.NODE_ENV !== 'production' ? require('dotenv').config({ path: '.env' }) : null;
const SiteLink = process.env.SITE_LINK
// Barcha ma'lumotlarni Google Sheetga yozuvchi funksiya
async function addToGoogleSheet(applicationData) {
    try {
        // .env faylingizdagi ma'lumotlar bilan Google API'ga ulanish
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // \n belgilari buzilmasligi uchun
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[0];

        // MODELNING BARCHA MA'LUMOTLARINI GOOGLE SHEETGA UZATISH
        await sheet.addRow({
            Username_ID: applicationData.usernameId,
            Student_Name: applicationData.studentFullName,
            Birth_Date: applicationData.birthDate,
            Nationality: applicationData.nationality,
            Permanent_Address: applicationData.permanentAddress,
            Phone: applicationData.phoneNumber ? applicationData.phoneNumber.replace(/^\+/, '') : '',
            Email: applicationData.emailAddress,

            // Pasport ob'ekti ichidagilar
            Passport_Seria_Number: `${applicationData.passportDetails.passportSeria}${applicationData.passportDetails.passportNumber}`,
            JSHSHIR: applicationData.passportDetails.jshshir,
            Passport_Given_Date: applicationData.passportDetails.givenDate,
            Passport_Expires_Date: applicationData.passportDetails.expiresDate,
            Passport_Given_By: applicationData.passportDetails.givenBy,

            // O'qish ma'lumotlari
            University: applicationData.universityName,
            Study_Form: applicationData.studyForm,
            Study_Field: applicationData.studyField,
            Course: applicationData.currentCourse,

            // Ilmiy faoliyat (Boolean qiymatlarni Ha/Yo'q ko'rinishida yozamiz)
            Is_Doing_Research: applicationData.isDoingResearch ? "Ha" : "Yo'q",
            Research_Details: applicationData.researchDetails || "",
            Has_Conference: applicationData.hasConferenceParticipation ? "Ha" : "Yo'q",
            Has_Publications: applicationData.hasPublications ? "Ha" : "Yo'q",
            Used_Previous_Grants: applicationData.usedPreviousGrants ? "Ha" : "Yo'q",
            Previous_Grant_Details: applicationData.previousGrantDetails || "",

            // Shartnoma va Oila
            Contract_Amount: applicationData.contractAmount,
            Family_Members_Count: applicationData.familyMembersCount,

            // Ota-onasi haqida
            Father_Name: applicationData.fatherFullName || "",
            Father_Work: applicationData.fatherWorkPlace || "",
            Father_Position: applicationData.fatherPosition || "",
            Father_Birth: applicationData.fatherBirthDate || "",
            Mother_Name: applicationData.motherFullName || "",
            Mother_Work: applicationData.motherWorkPlace || "",
            Mother_Position: applicationData.motherPosition || "",
            Mother_Birth: applicationData.motherBirthDate || "",

            // Aka-ukalar massivining soni
            Imtiyoz_File: `${SiteLink}${applicationData.imtiyoz}`,

            // Motivatsiya xati
            Motivation_Letter: applicationData.motivationLetter,

            // Fayllar linklari
            CV_File: `${SiteLink}${applicationData.cvFile}`,
            GPA_File: `${SiteLink}${applicationData.gpaFile}`,
            University_Certificate: `${SiteLink}${applicationData.universityCertificate}`,
            Passport_File: `${SiteLink}${applicationData.passportFile}`,

            // Status va vaqt
            Status: applicationData.status,
            Sana: new Date().toLocaleString(),
            iswinner: applicationData.isWinner,
            
        });

    } catch (sheetError) {
        console.error("Google Sheets Xatoligi:", sheetError.message);
    }
}

async function updateGoogleSheetStatus(usernameId, newStatus) {
    try {
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        // 1. Google Sheet-dagi barcha qatorlarni o'qib olamiz
        const rows = await sheet.getRows();

        // 2. Ichidan aynan biz qidirayotgan usernameId ga teng bo'lgan qatorni topamiz
        const rowToUpdate = rows.find(row => row.get('Username_ID') === usernameId);

        if (rowToUpdate) {
            // 3. Status ustuniga yangi qiymatni yozamiz
            rowToUpdate.set('Status', newStatus);

            // 4. O'zgarishni Google Sheet-da saqlaymiz
            await rowToUpdate.save();
        } else {
            console.log("Google Sheet-dan bunday foydalanuvchi topilmadi.");
        }
    } catch (sheetError) {
        console.error("Google Sheet-ni yangilashda xatolik:", sheetError.message);
    }
}

async function updateGoogleSheetWinner(usernameId, status) {
    try {
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        // 1. Google Sheet-dagi barcha qatorlarni o'qib olamiz
        const rows = await sheet.getRows();

        // 2. Ichidan aynan biz qidirayotgan usernameId ga teng bo'lgan qatorni topamiz
        const rowToUpdate = rows.find(row => row.get('Username_ID') === usernameId);

        if (rowToUpdate) {
            // 3. Status ustuniga yangi qiymatni yozamiz
            rowToUpdate.set('isWinner', status);

            // 4. O'zgarishni Google Sheet-da saqlaymiz
            await rowToUpdate.save();
        } else {
            console.log("Google Sheet-dan bunday foydalanuvchi topilmadi.");
        }
    } catch (sheetError) {
        console.error("Google Sheet-ni yangilashda xatolik:", sheetError.message);
    }
}

const fs = require("fs");
const md5 = require('md5');
const applicationModel = require("../models/applicationModel.js");
module.exports = {
    add: async (req, res) => {
    try {
        // express-fileupload'da matnli ma'lumotlar req.body ichida keladi
        const {
            usernameId, studentFullName, birthDate, nationality, permanentAddress, phoneNumber, emailAddress,
            passportDetails, universityName, studyForm, studyField, currentCourse, isDoingResearch,
            researchDetails, hasConferenceParticipation, hasPublications, usedPreviousGrants,
            previousGrantDetails, contractAmount, familyMembersCount, fatherFullName, fatherWorkPlace,
            fatherPosition, fatherBirthDate, motherFullName, motherWorkPlace, motherPosition,
            motherBirthDate, siblings, motivationLetter, action
        } = req.body;

        // Fayllar kelmasa bo'sh obyekt qilib olamiz (Crash bo'lishini oldini oladi)
        const files = req.files || {};

        // 1. Majburiy matnli maydonlarni to'liq tekshirish
        if (!usernameId || !studentFullName || !phoneNumber || !emailAddress || !universityName || !motivationLetter) {
            return res.send({
                ok: false,
                msg: "Iltimos, barcha majburiy matnli maydonlarni to'ldiring!"
            });
        }

        // Pasport obyektini xavfsiz parslash (Frontend string qilib yuborgan bo'lsa)
        let parsedPassportDetails = {};
        if (passportDetails) {
            try {
                parsedPassportDetails = typeof passportDetails === 'string'
                    ? JSON.parse(passportDetails)
                    : passportDetails;
            } catch (e) {
                return res.send({ ok: false, msg: "Pasport ma'lumotlari formati noto'g'ri!" });
            }
        }

        if (!parsedPassportDetails.passportSeria || !parsedPassportDetails.passportNumber || !parsedPassportDetails.jshshir || !parsedPassportDetails.givenDate || !parsedPassportDetails.expiresDate || !parsedPassportDetails.givenBy) {
            return res.send({
                ok: false,
                msg: "Pasport ma'lumotlari to'liq kiritilishi shart!"
            });
        }

        // 2. Majburiy 4 ta fayl kelganini tekshirish
        if (!files.cvFile || !files.gpaFile || !files.universityCertificate || !files.passportFile) {
            return res.send({
                ok: false,
                msg: "Iltimos, barcha so'ralgan majburiy hujjatlarni yuklang!"
            });
        }

        // 3. Takroriy arizani tekshirish (Bazadan)
        const existingApplication = await Application.findOne({ usernameId });
        if (existingApplication) {
            return res.send({
                ok: false,
                msg: "Siz allaqachon ariza yuborgansiz!"
            });
        }

        // Fayllar saqlanadigan papka mavjudligini tekshirish, bo'lmasa yaratish
        const dirPath = './public/applications';
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // 4. Majburiy fayllar uchun unikal nom va saqlash yo'llarini (path) yaratish
        const cvPath = `/public/applications/${md5(files.cvFile.name + Date.now())}_cv.pdf`;
        const gpaPath = `/public/applications/${md5(files.gpaFile.name + Date.now())}_gpa.pdf`;
        const certPath = `/public/applications/${md5(files.universityCertificate.name + Date.now())}_cert.pdf`;
        const passportPath = `/public/applications/${md5(files.passportFile.name + Date.now())}_passport.pdf`;
        
        // Imtiyoz faylini xavfsiz tekshirish (Faqat fayl kelgan bo'lsagina yo'l yaratadi, aks holda null)
        let imtiyozPath = null;
        if (files.privilegeFile) {
            imtiyozPath = `/public/applications/${md5(files.privilegeFile.name + Date.now())}_imtiyoz.pdf`;
        }

        // Siblings (Massiv) ma'lumotini parslash
        let parsedSiblings = siblings;
        if (typeof siblings === 'string' && siblings.trim() !== '') {
            try { parsedSiblings = JSON.parse(siblings); } catch (e) { parsedSiblings = []; }
        }

        // 5. Ma'lumotlarni bazaga yozish
        const newApplication = new Application({
            usernameId, studentFullName, birthDate, nationality, permanentAddress, phoneNumber, emailAddress,
            passportDetails: parsedPassportDetails, universityName, studyForm, studyField, currentCourse, isDoingResearch,
            researchDetails, hasConferenceParticipation, hasPublications, usedPreviousGrants,
            previousGrantDetails, contractAmount, familyMembersCount, fatherFullName, fatherWorkPlace,
            fatherPosition, fatherBirthDate, motherFullName, motherWorkPlace, motherPosition,
            motherBirthDate, siblings: parsedSiblings, motivationLetter,
            cvFile: cvPath,
            gpaFile: gpaPath,
            universityCertificate: certPath,
            passportFile: passportPath,
            imtiyoz: imtiyozPath, // Imtiyoz bo'lmasa null saqlanadi
            action: action
        });

        // Bazaga saqlaymiz
        const savedApplication = await newApplication.save();

        // 6. Majburiy fayllarni server xotirasiga ko'chirish (.mv() orqali)
        await files.cvFile.mv(`.${cvPath}`);
        await files.gpaFile.mv(`.${gpaPath}`);
        await files.universityCertificate.mv(`.${certPath}`);
        await files.passportFile.mv(`.${passportPath}`);
        
        // Agar imtiyoz fayli yuklangan bo'lsagina uni serverga yuklaymiz
        if (files.privilegeFile && imtiyozPath) {
            await files.privilegeFile.mv(`.${imtiyozPath}`);
        }

        // 7. Bir vaqtning o'zida hamma ma'lumotni Google Sheetga uzatish
        if (typeof addToGoogleSheet === 'function') {
            await addToGoogleSheet(savedApplication);
        }

        return res.send({
            ok: true,
            msg: "Arizangiz muvaffaqiyatli jo'natildi!"
        });

    } catch (err) {
        console.error("Xatolik:", err);
        return res.send({
            ok: false,
            msg: err.message || "Arizani saqlashda kutilmagan xatolik yuz berdi."
        });
    }
},
    resend: async (req, res) => {
    try {
        // express-fileupload'da matnli ma'lumotlar req.body ichida keladi
        const {
            usernameId, studentFullName, birthDate, nationality, permanentAddress, phoneNumber, emailAddress,
            passportDetails, universityName, studyForm, studyField, currentCourse, isDoingResearch,
            researchDetails, hasConferenceParticipation, hasPublications, usedPreviousGrants,
            previousGrantDetails, contractAmount, familyMembersCount, fatherFullName, fatherWorkPlace,
            fatherPosition, fatherBirthDate, motherFullName, motherWorkPlace, motherPosition,
            motherBirthDate, siblings, motivationLetter, action
        } = req.body;

        // Fayllar req.files ichida keladi
        const files = req.files || {};

        // 1. Majburiy matnli maydonlarni to'liq tekshirish
        if (!usernameId || !studentFullName || !phoneNumber || !emailAddress || !universityName || !motivationLetter) {
            return res.send({
                ok: false,
                msg: "Iltimos, barcha majburiy matnli maydonlarni to'ldiring!"
            });
        }

        // Pasport obyektini xavfsiz parslash (Frontend string qilib yuborgan bo'lsa)
        let parsedPassportDetails = {};
        if (passportDetails) {
            try {
                parsedPassportDetails = typeof passportDetails === 'string'
                    ? JSON.parse(passportDetails)
                    : passportDetails;
            } catch (e) {
                return res.send({ ok: false, msg: "Pasport ma'lumotlari formati noto'g'ri!" });
            }
        }

        if (!parsedPassportDetails.passportSeria || !parsedPassportDetails.passportNumber || !parsedPassportDetails.jshshir || !parsedPassportDetails.givenDate || !parsedPassportDetails.expiresDate || !parsedPassportDetails.givenBy) {
            return res.send({
                ok: false,
                msg: "Pasport ma'lumotlari to'liq kiritilishi shart!"
            });
        }

        // 2. Majburiy 4 ta fayl kelganini tekshirish
        if (!files.cvFile || !files.gpaFile || !files.universityCertificate || !files.passportFile) {
            return res.send({
                ok: false,
                msg: "Iltimos, barcha so'ralgan majburiy hujjatlarni yuklang!"
            });
        }

        // 3. Eski (rad etilgan yoki mavjud) arizani qidirish
        const existingApplication = await Application.findOne({ usernameId });
        
        // Agar eski ariza bo'lsa, uning yuklangan eski fayllarini jismonan serverdan o'chiramiz
        if (existingApplication) {
            const oldFiles = [
                existingApplication.cvFile,
                existingApplication.gpaFile,
                existingApplication.universityCertificate,
                existingApplication.passportFile,
                existingApplication.imtiyoz
            ];

            oldFiles.forEach(filePath => {
                if (filePath) {
                    // Yo'lni to'g'rilash (masalan, '/public/...' ni './public/...' ga)
                    const fullPath = filePath.startsWith('.') ? filePath : `.${filePath}`;
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath); // Faylni o'chirish
                    }
                }
            });

            // Eski arizani ma'lumotlar bazasidan o'chiramiz
            await Application.deleteOne({ usernameId });
        }

        // Fayllar saqlanadigan papka mavjudligini tekshirish, bo'lmasa yaratish
        const dirPath = './public/applications';
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // 4. Yangi fayllar uchun unikal nom va saqlash yo'llarini (path) yaratish
        const cvPath = `/public/applications/${md5(files.cvFile.name + Date.now())}_cv.pdf`;
        const gpaPath = `/public/applications/${md5(files.gpaFile.name + Date.now())}_gpa.pdf`;
        const certPath = `/public/applications/${md5(files.universityCertificate.name + Date.now())}_cert.pdf`;
        const passportPath = `/public/applications/${md5(files.passportFile.name + Date.now())}_passport.pdf`;
        
        // Imtiyoz fayli ixtiyoriy (agar jo'natilgan bo'lsa yo'l yaratamiz, bo'lmasa null)
        let imtiyozPath = null;
        if (files.privilegeFile) {
            imtiyozPath = `/public/applications/${md5(files.privilegeFile.name + Date.now())}_imtiyoz.pdf`;
        }

        // Siblings (Massiv) ma'lumotini parslash
        let parsedSiblings = siblings;
        if (typeof siblings === 'string' && siblings.trim() !== '') {
            try { parsedSiblings = JSON.parse(siblings); } catch (e) { parsedSiblings = []; }
        }

        // 5. Yangi ma'lumotlarni bazaga yozish
        const newApplication = new Application({
            usernameId, studentFullName, birthDate, nationality, permanentAddress, phoneNumber, emailAddress,
            passportDetails: parsedPassportDetails, universityName, studyForm, studyField, currentCourse, isDoingResearch,
            researchDetails, hasConferenceParticipation, hasPublications, usedPreviousGrants,
            previousGrantDetails, contractAmount, familyMembersCount, fatherFullName, fatherWorkPlace,
            fatherPosition, fatherBirthDate, motherFullName, motherWorkPlace, motherPosition,
            motherBirthDate, siblings: parsedSiblings, motivationLetter,
            cvFile: cvPath,
            gpaFile: gpaPath,
            universityCertificate: certPath,
            passportFile: passportPath,
            imtiyoz: imtiyozPath, // Bo'sh bo'lsa null saqlanadi
            action: action,
            status: 'resended' // Qayta yuborilgan statusi
        });

        // Bazaga saqlaymiz
        const savedApplication = await newApplication.save();

        // 6. Fayllarni haqiqatda server xotirasiga ko'chirish (.mv() orqali)
        await files.cvFile.mv(`.${cvPath}`);
        await files.gpaFile.mv(`.${gpaPath}`);
        await files.universityCertificate.mv(`.${certPath}`);
        await files.passportFile.mv(`.${passportPath}`);
        
        // Agar imtiyoz fayli yuklangan bo'lsagina uni serverga ko'chiramiz
        if (files.privilegeFile && imtiyozPath) {
            await files.privilegeFile.mv(`.${imtiyozPath}`);
        }

        // 7. Bir vaqtning o'zida hamma ma'lumotni Google Sheetga uzatish
        if (typeof addToGoogleSheet === 'function') {
            await addToGoogleSheet(savedApplication);
        }

        return res.send({
            ok: true,
            msg: "Arizangiz muvaffaqiyatli qayta jo'natildi!"
        });

    } catch (err) {
        console.error("Xatolik:", err);
        return res.send({
            ok: false,
            msg: err.message || "Arizani qayta saqlashda kutilmagan xatolik yuz berdi."
        });
    }
},
    updateStatus: async (req, res) => {
        try {
            // Frontend yoki Postmandan ariza egasining usernameId va yangi statusini olamiz
            const { usernameId, status, comment, action } = req.body;

            // 1. Kiruvchi ma'lumotlarni tekshiramiz
            if (!usernameId || !status ) {
                return res.send({
                    ok: false,
                    msg: "Foydalanuvchi ID-si (usernameId) va yangi status kiritilishi shart!"
                });
            }

            // 2. Status faqat ruxsat etilgan qiymatlardan biri ekanligini tekshiramiz
            // Rad etilishidan qaytarish -> 'pending' hisoblanadi
            const allowedStatuses = ['pending', 'approved', 'rejected'];
            if (!allowedStatuses.includes(status)) {
                return res.send({
                    ok: false,
                    msg: "Xato status! Status faqat 'pending', 'approved' yoki 'rejected' bo'lishi mumkin."
                });
            }

            // 3. MongoDB bazasidan arizani qidirib topib, statusini yangilaymiz
            const updatedApplication = await Application.findOneAndUpdate(
                { usernameId: usernameId }, // qidiruv sharti
                { status: status, comment: comment, action: action },         // yangilanadigan maydonlar
                { returnDocument: 'after' }               // bizga yangilangan yangi ma'lumotni qaytarsin
            );

            // Agar bazadan bunday ariza topilmasa
            if (!updatedApplication) {
                return res.send({
                    ok: false,
                    msg: "Bunday foydalanuvchiga tegishli ariza topilmadi!"
                });
            }

            // 4. Baza muvaffaqiyatli yangilangach, Google Sheet-ni ham yangilaymiz
            await updateGoogleSheetStatus(usernameId, status);

            // 5. Adminga chiroyli javob qaytaramiz
            let statusUz = status === 'approved' ? 'Qabul qilindi' : status === 'rejected' ? 'Rad etildi' : 'Kutilmoqda (Qaytarildi)';

            return res.send({
                ok: true,
                msg: `Ariza statusi muvaffaqiyatli o'zgartirildi: ${statusUz}`,
                data: updatedApplication
            });

        } catch (err) {
            console.error("Statusni yangilashda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Statusni yangilashda kutilmagan xatolik yuz berdi."
            });
        }
    },
    getAll: async (req, res) => {
        try {
            // Bazadagi barcha arizalarni eng yangisidan boshlab olish
            const applications = await Application.find().sort({ createdAt: -1 });

            // Agar arizalar topilmasa, bo'sh massiv qaytaradi
            return res.send({
                ok: true,
                msg: "Barcha arizalar muvaffaqiyatli yuklandi!",
                count: applications.length,
                data: applications
            });

        } catch (err) {
            console.error("GetAll Xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Arizalarni yuklashda kutilmagan xatolik yuz berdi."
            });
        }
    },
    deleteAll: async (req, res) => {
        try {
            // 1. Bazadagi barcha arizalarni o'chirish
            const result = await Application.deleteMany({});

            // 2. Server papkasidagi yuklangan barcha fayllarni ham o'chirib tozalash
            const folderPath = './public/applications';
            if (fs.existsSync(folderPath)) {
                const files = fs.readdirSync(folderPath);
                for (const file of files) {
                    // .gitkeep yoki boshqa tizim fayllari o'chib ketmasligi uchun tekshiruv
                    if (file !== '.gitkeep') {
                        fs.unlinkSync(path.join(folderPath, file));
                    }
                }
            }

            return res.send({
                ok: true,
                msg: "Barcha arizalar bazadan va server xotirasidan butunlay o'chirib tashlandi!",
                deletedCount: result.deletedCount
            });

        } catch (err) {
            console.error("DeleteAll Xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Arizalarni o'chirishda kutilmagan xatolik yuz berdi."
            });
        }
    },
    getOne: async (req, res) => {
        try {
            // URL parametridan yoki request body'dan usernameId ni olamiz
            // (Odatda GET so'rovlarida parametr orqali /api/applications/:usernameId ko'rinishida keladi)
            const usernameId = req.params.usernameId || req.body.usernameId;

            // ID kiritilganini tekshiramiz
            if (!usernameId) {
                return res.send({
                    ok: false,
                    msg: "Foydalanuvchi ID-si (usernameId) kiritilishi shart!"
                });
            }

            // MongoDB bazasidan arizani qidiramiz
            const application = await Application.findOne({ usernameId: usernameId });

            // Agar ariza topilmasa
            if (!application) {
                return res.send({
                    ok: false,
                    msg: "Bunday foydalanuvchiga tegishli ariza topilmadi!"
                });
            }

            // Ariza muvaffaqiyatli topilsa, uni qaytaramiz
            return res.send({
                ok: true,
                msg: "Ariza muvaffaqiyatli topildi!",
                data: application
            });

        } catch (err) {
            console.error("GetOne Xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Arizani yuklashda kutilmagan xatolik yuz berdi."
            });
        }
    },
    updateWinner: async (req, res) => {
        try {
            // Frontend yoki Postmandan ariza egasining usernameId va yangi statusini olamiz
            const { usernameId, status,action } = req.body;

            // 1. Kiruvchi ma'lumotlarni tekshiramiz
            if (!usernameId || !status) {
                return res.send({
                    ok: false,
                    msg: "Foydalanuvchi ID-si (usernameId) kiritilmadi"
                });
            }
            // 3. MongoDB bazasidan arizani qidirib topib, statusini yangilaymiz
            const updatedApplication = await Application.findOneAndUpdate(
                { usernameId: usernameId }, // qidiruv sharti
                { isWinner: status, action: action },         // yangilanadigan maydon
                { returnDocument: 'after' }               // bizga yangilangan yangi ma'lumotni qaytarsin
            );

            // Agar bazadan bunday ariza topilmasa
            if (!updatedApplication) {
                return res.send({
                    ok: false,
                    msg: "Bunday foydalanuvchiga tegishli ariza topilmadi!"
                });
            }

            // 4. Baza muvaffaqiyatli yangilangach, Google Sheet-ni ham yangilaymiz
            await updateGoogleSheetWinner(usernameId, status);

            return res.send({
                ok: true,
                msg: `Good done`
            });

        } catch (err) {
            console.error("Yangilashda xatolik:", err);
            return res.send({
                ok: false,
                msg: err.message || "Yangilashda kutilmagan xatolik yuz berdi."
            });
        }
    }

};