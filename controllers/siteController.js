const Stipendiat = require('../models/stpendiyatM');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const fs = require('fs');

const path = require("path");
// Hujjatlar kalitlari ro'yxati (Model va Frontend bilan bir xil nomda)
const DOCUMENT_KEYS = [
  "residenceCertificate",
  "studyCertificate",
  "familyCertificate",
  "passportCopy",
  "motivationLetter",
  "objectiveSheet",
  "schoolDiploma",
  "transcript",
  "dtmResult",
  "ieltsCertificate",
  "cefrCertificate",
  "achievementsProof",
  "motivationProof"
];
// Stipendiat o'z kabinetidan o'zgartira oladigan matnli maydonlar
const STP_EDITABLE_FIELDS = [
  "fullName",
  "email",
  "phone",
  "university",
  "fieldOfStudy",
  "degree",
  "isProfileCompleted",
];
module.exports = {
  // 1. Yangi stipendiat qo'shish (Admin yoki Ro'yxatdan o'tkazish)
  add: async (req, res) => {
    try {
      const { login, password, type,category } = req.body;
      if (!login || !password || !type || !category) {
        return res.send({
          ok: false,
          msg: "Qatorlarni to'ldiring",
        });
      }

      if (login.length < 5) {
        return res.send({
          ok: false,
          msg: "Login 5 ta belgidan kam bo'lmasligi kerak",
        });
      }

      if (password.length < 6) {
        return res.send({
          ok: false,
          msg: "Password 6 ta belgidan kam bo'lmasligi kerak",
        });
      }

      const $user = await Stipendiat.findOne({ login });
      if ($user) {
        return res.send({
          ok: false,
          msg: "Bunday login mavjud",
        });
      }

      const hashedPassword = md5(password);
      await new Stipendiat({
        login,
        password: hashedPassword,
        type,
        category
      }).save();

      return res.send({
        ok: true,
        msg: "Stipendiat muvaffaqiyatli qo'shildi",
      });
    } catch (err) {
      console.error(err);
      return res.send({
        ok: false,
        msg: "Xatolik yuz berdi",
      });
    }
  },
  // 2. Barcha stipendiatlarni olish
  getall: async (req, res) => {

    try {
      const stipendiats = await Stipendiat.find().select("-password -access_token");

      return res.send({
        ok: true,
        data: stipendiats,
      });
    } catch (err) {
      console.error(err);
      return res.send({
        ok: false,
        msg: "Xatolik yuz berdi",
      });
    }
  },
  // 3. Tahrirlash (Profil ma'lumotlari, 3x4 rasm va 13 ta hujjat fayllarini yuklash)
  edit: async (req, res) => {
    try {
      let id = req.body.id;
      let updateData = { ...req.body };

      // Stipendiat o'zi tahrirlayotgan bo'lsa: faqat o'z profilini va faqat ruxsat etilgan maydonlarni
      if (req.user?.stpId) {
        id = String(req.user.stpId);
        updateData = {};
        for (const key of STP_EDITABLE_FIELDS) {
          if (req.body[key] !== undefined) updateData[key] = req.body[key];
        }
      }

      if (!id) {
        return res.send({
          ok: false,
          msg: "Stipendiat ID si ko'rsatilmadi",
        });
      }

      // Mavjud stipendiatni bazadan izlaymiz
      const currentStipendiat = await Stipendiat.findById(id);
      if (!currentStipendiat) {
        return res.send({
          ok: false,
          msg: "Stipendiat topilmadi",
        });
      }

      delete updateData.id;

      // Login va Parol validatsiyalari
      if (updateData.login && updateData.login.length < 5) {
        return res.send({
          ok: false,
          msg: "Login 5 ta belgidan kam bo'lmasligi kerak",
        });
      }

      if (updateData.password && updateData.password.trim() !== "") {
        if (updateData.password.length < 6) {
          return res.send({
            ok: false,
            msg: "Password 6 ta belgidan kam bo'lmasligi kerak",
          });
        }
        updateData.password = md5(updateData.password);
      } else {
        delete updateData.password;
      }

      // --- FAYLLARNI QABUL QILISH VA SAQLASH MANTIQLARI ---
      if (req.files) {
        // Har bir talaba uchun papka: ./public/uploads/stipendiats/STIPENDIAT_ID
        const folderRelativePath = `/public/uploads/stipendiats/${id}`;
        const fullFolderPath = path.join(__dirname, "..", folderRelativePath);

        if (!fs.existsSync(fullFolderPath)) {
          fs.mkdirSync(fullFolderPath, { recursive: true });
        }

        // A) 3x4 Rasm yuklanayotgan bo'lsa
        if (req.files.photo3x4) {
          const photoFile = req.files.photo3x4;
          const photoExt = path.extname(photoFile.name).toLowerCase();
          const uniquePhotoName = `photo3x4_${md5(Date.now())}${photoExt}`;
          const photoDbPath = `${folderRelativePath}/${uniquePhotoName}`;
          const savePhotoPath = path.join(__dirname, "..", photoDbPath);

          // Eski 3x4 rasmni diskdan o'chirish
          if (currentStipendiat.photo3x4) {
            const oldPhotoPath = path.join(__dirname, "..", currentStipendiat.photo3x4);
            if (fs.existsSync(oldPhotoPath)) {
              try { fs.unlinkSync(oldPhotoPath); } catch (e) { }
            }
          }

          await photoFile.mv(savePhotoPath);
          updateData.photo3x4 = photoDbPath;
        }

        // B) Hujjat fayllarini yuklash (13 ta hujjat uchun)
        updateData.documents = { ...currentStipendiat.documents?.toObject() };

        for (const docKey of DOCUMENT_KEYS) {
          if (req.files[docKey]) {
            const docFile = req.files[docKey];
            const fileExt = path.extname(docFile.name).toLowerCase();

            // Faqat PDF yoki rasm formatlarini tekshirish
            const allowedExts = [".pdf", ".png", ".jpg", ".jpeg"];
            if (!allowedExts.includes(fileExt)) {
              return res.send({
                ok: false,
                msg: `${docKey} uchun faqat PDF yoki JPG/PNG yuklanishi mumkin!`,
              });
            }

            const uniqueDocName = `${docKey}_${md5(Date.now())}${fileExt}`;
            const docDbPath = `${folderRelativePath}/${uniqueDocName}`;
            const saveDocPath = path.join(__dirname, "..", docDbPath);

            // Eski faylni o'chirish
            if (currentStipendiat.documents && currentStipendiat.documents[docKey]) {
              const oldDocPath = path.join(__dirname, "..", currentStipendiat.documents[docKey]);
              if (fs.existsSync(oldDocPath)) {
                try { fs.unlinkSync(oldDocPath); } catch (e) { }
              }
            }

            await docFile.mv(saveDocPath);
            updateData.documents[docKey] = docDbPath;
          }
        }
      }
      const updatedStipendiat = await Stipendiat.findByIdAndUpdate(
        id,
        updateData,
        { returnDocument: "after" }
      ).select("-password");

      return res.send({
        ok: true,
        msg: "Muvaffaqiyatli yangilandi",
        data: updatedStipendiat,
      });
    } catch (err) {
      console.error("edit error:", err);
      return res.send({
        ok: false,
        msg: "Xatolik yuz berdi",
      });
    }
  },
  editpass: async (req, res) => {
          try {
              const { _id } = req.body; 
              const id = _id;// Tahrirlash uchun ID ni req.body yoki req.params orqali olish mumkin
              const { login, password,category,status,type } = req.body;
            const username =login
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
              if (username) updateData.login = username;
              if (password) updateData.password = md5(password);
              if (category) updateData.category = category;
              if (status) updateData.status = status;
              if (type) updateData.type = type;
              const updatedUser = await Stipendiat.findByIdAndUpdate(id, updateData, { returnDocument: 'after'});
  
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
  deleteachievement: async (req, res) => {
    try {
      const { id } = req.params; // Bu yerda URL parametri sifatida `title` keladi (masalan: req.params.id / req.params.title)
      const { stpId } = req.body; // Yoki req.query / req.user.id
      const stipendiatId = stpId;
      if (!id) {
        return res.send({
          ok: false,
          msg: "O'chiriladigan yutuq sarlavhasi (title) ko'rsatilmadi",
        });
      }

      // $pull operatori orqali title mos kelgan obyektni achievements massividan o'chiramiz
      const updatedStipendiat = await Stipendiat.findByIdAndUpdate(stipendiatId, {
        $pull: { achievements: { _id: id } }
      });

      if (!updatedStipendiat) {
        return res.send({
          ok: false,
          msg: "Stipendiat topilmadi yoki yutuq o'chirilmadi",
        });
      }

      return res.send({
        ok: true,
        msg: "Yutuq muvaffaqiyatli o'chirildi",
        data: updatedStipendiat,
      });
    } catch (err) {
      console.error("deleteAchievement error:", err);
      return res.send({
        ok: false,
        msg: "Yutuqni o'chirishda xatolik yuz berdi",
      });
    }
  },
  // 4. O'chirish (Stipendiat o'chirilganda uning papkasidagi fayllarini ham diskdan o'chirish)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.send({
          ok: false,
          msg: "ID topilmadi",
        });
      }

      const deletedStipendiat = await Stipendiat.findByIdAndDelete(id);

      if (!deletedStipendiat) {
        return res.send({
          ok: false,
          msg: "Stipendiat topilmadi yoki allaqachon o'chirilgan",
        });
      }

      // Talabaga tegishli papka va barcha yuklangan hujjatlarni diskdan o'chirib tashlash
      const folderRelativePath = `/public/uploads/stipendiats/${id}`;
      const fullFolderPath = path.join(__dirname, "..", folderRelativePath);
      if (fs.existsSync(fullFolderPath)) {
        try { fs.rmSync(fullFolderPath, { recursive: true, force: true }); } catch (e) { }
      }

      return res.send({
        ok: true,
        msg: "Muvaffaqiyatli o'chirildi",
      });
    } catch (err) {
      console.error(err);
      return res.send({
        ok: false,
        msg: "Xatolik yuz berdi",
      });
    }
  },
  // 5. Check
  check: async function (req, res) {
    res.send({
      ok: true,
      stpInfo: req.user,
    });
  },
  // 6. Sign In
  signin: async (req, res) => {
    try {
      const { login, password } = req.body;

      if (!login || !password) {
        return res.send({
          ok: false,
          msg: "Qatorlarni to'ldiring!",
        });
      }

      const $user = await Stipendiat.findOne({ login });

      if (!$user) {
        return res.send({
          ok: false,
          msg: "Ushbu nom bilan foydalanuvchi topilmadi!",
        });
      }

      const isMatch = md5(password) === $user.password;
      if (!isMatch) {
        return res.send({
          ok: false,
          msg: "Parol xato kiritildi!",
        });
      }

      const token = jwt.sign(
        { stpId: $user._id },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      await Stipendiat.findByIdAndUpdate($user._id, { access_token: token }); $user.access_token = token;
      $user.password = undefined;

      return res.send({
        ok: true,
        msg: "Well done!",
        access_token: token,
        data: $user,
      });
    } catch (err) {
      console.error(err);
      return res.send({
        ok: false,
        msg: "Xatolik yuz berdi",
      });
    }
  },
  // 7. Leave
  leave: async (req, res) => {
    try {
      const { stpId } = req.user;
      const $user = await Stipendiat.findOne({ _id: stpId });

      if ($user) {
        await $user.set({ access_token: "none" }).save();
      }

      return res.send({
        ok: true,
        msg: "Profildan chiqish amalga oshdi!",
      });
    } catch (err) {
      console.error(err);
      return res.send({
        ok: false,
        msg: "Xatolik yuz berdi",
      });
    }
  },
  // 8. Get One
  getone: async (req, res) => {
    try {
      const stpId = req.user?.stpId || req.params.id || req.body.stpId;

      if (!stpId) {
        return res.send({
          ok: false,
          msg: "Stipendiat ID si topilmadi",
        });
      }

      const stipendiat = await Stipendiat.findById(stpId).select("-password");

      if (!stipendiat) {
        return res.send({
          ok: false,
          msg: "Stipendiat topilmadi",
        });
      }

      return res.send({
        ok: true,
        data: stipendiat,
      });
    } catch (err) {
      console.error(err);
      return res.send({
        ok: false,
        msg: "Xatolik yuz berdi",
      });
    }
  },
  // 1. Stipendiat tomonidan Kontrakt Shartnomasini (contractAgreement) yuklash/tahrirlash
  adddocstp: async (req, res) => {
    try {
      // User ID token (middleware) orqali keladi yoki request body'dan olinadi
      const stpId = req.user?.stpId || req.body.id || req.body.stpId;

      if (!stpId) {
        return res.send({
          ok: false,
          msg: "Stipendiat ID si topilmadi",
        });
      }

      if (!req.files || !req.files.contractAgreement) {
        return res.send({
          ok: false,
          msg: "Iltimos, kontrakt shartnomasi faylini (contractAgreement) yuklang!",
        });
      }

      const stipendiat = await Stipendiat.findById(stpId);
      if (!stipendiat) {
        return res.send({
          ok: false,
          msg: "Stipendiat topilmadi",
        });
      }

      const file = req.files.contractAgreement;
      const fileExt = path.extname(file.name).toLowerCase();
      const allowedExts = [".pdf", ".png", ".jpg", ".jpeg"];

      if (!allowedExts.includes(fileExt)) {
        return res.send({
          ok: false,
          msg: "Faqat PDF, JPG yoki PNG formatidagi fayllarni yuklashingiz mumkin!",
        });
      }

      const folderRelativePath = `/public/uploads/stipendiats/${stpId}`;
      const fullFolderPath = path.join(__dirname, "..", folderRelativePath);

      if (!fs.existsSync(fullFolderPath)) {
        fs.mkdirSync(fullFolderPath, { recursive: true });
      }

      // Eski kontrakt fayli bo'lsa diskdan o'chirib tashlaymiz
      if (stipendiat.contractAgreement) {
        const oldFilePath = path.join(__dirname, "..", stipendiat.contractAgreement);
        if (fs.existsSync(oldFilePath)) {
          try { fs.unlinkSync(oldFilePath); } catch (e) { }
        }
      }

      const uniqueFileName = `contract_${md5(Date.now() + file.name)}${fileExt}`;
      const fileDbPath = `${folderRelativePath}/${uniqueFileName}`;
      const savePath = path.join(__dirname, "..", fileDbPath);

      await file.mv(savePath);

      stipendiat.contractAgreement = fileDbPath;
      await stipendiat.save();

      return res.send({
        ok: true,
        msg: "Kontrakt shartnomasi muvaffaqiyatli yuklandi!",
        data: stipendiat,
      });
    } catch (err) {
      console.error("addDocStp xatolik:", err);
      return res.send({
        ok: false,
        msg: "Kontrakt shartnomasini yuklashda xatolik yuz berdi",
      });
    }
  },

  // 2. Admin tomonidan To'lov Chekini (paymentReceipt) yuklash/tahrirlash
  adddocadmin: async (req, res) => {
    try {
      const { id } = req.body; // Qaysi stipendiatga chek biriktirilayotgani

      if (!id) {
        return res.send({
          ok: false,
          msg: "Stipendiat ID si kiritilishi shart",
        });
      }

      if (!req.files || !req.files.paymentReceipt) {
        return res.send({
          ok: false,
          msg: "Iltimos, to'lov cheki faylini (paymentReceipt) yuklang!",
        });
      }

      const stipendiat = await Stipendiat.findById(id);
      if (!stipendiat) {
        return res.send({
          ok: false,
          msg: "Stipendiat topilmadi",
        });
      }

      const file = req.files.paymentReceipt;
      const fileExt = path.extname(file.name).toLowerCase();
      const allowedExts = [".pdf", ".png", ".jpg", ".jpeg"];

      if (!allowedExts.includes(fileExt)) {
        return res.send({
          ok: false,
          msg: "Faqat PDF, JPG yoki PNG formatidagi fayllarni yuklashingiz mumkin!",
        });
      }

      const folderRelativePath = `/public/uploads/stipendiats/${id}`;
      const fullFolderPath = path.join(__dirname, "..", folderRelativePath);

      if (!fs.existsSync(fullFolderPath)) {
        fs.mkdirSync(fullFolderPath, { recursive: true });
      }

      // Eski chek fayli bo'lsa diskdan o'chirish
      if (stipendiat.paymentReceipt) {
        const oldFilePath = path.join(__dirname, "..", stipendiat.paymentReceipt);
        if (fs.existsSync(oldFilePath)) {
          try { fs.unlinkSync(oldFilePath); } catch (e) { }
        }
      }

      const uniqueFileName = `receipt_${md5(Date.now() + file.name)}${fileExt}`;
      const fileDbPath = `${folderRelativePath}/${uniqueFileName}`;
      const savePath = path.join(__dirname, "..", fileDbPath);

      await file.mv(savePath);

      stipendiat.paymentReceipt = fileDbPath;
      await stipendiat.save();

      return res.send({
        ok: true,
        msg: "To'lov cheki muvaffaqiyatli yuklandi!",
        data: stipendiat,
      });
    } catch (err) {
      console.error("addDocAdmin xatolik:", err);
      return res.send({
        ok: false,
        msg: "To'lov chekini yuklashda xatolik yuz berdi",
      });
    }
  },
  // 3. Admin tomonidan to'lov chekini (paymentReceipt) yoki kontrakt faylini o'chirish
  deldocadmin: async (req, res) => {
    try {
      const { id, docType } = req.body; // docType: "paymentReceipt" yoki "contractAgreement"

      if (!id) {
        return res.send({
          ok: false,
          msg: "Stipendiat ID si kiritilishi shart",
        });
      }

      if (!docType || !["paymentReceipt", "contractAgreement"].includes(docType)) {
        return res.send({
          ok: false,
          msg: "O'chiriladigan hujjat turi (docType) noaniq yoki xato kiritildi!",
        });
      }

      const stipendiat = await Stipendiat.findById(id);
      if (!stipendiat) {
        return res.send({
          ok: false,
          msg: "Stipendiat topilmadi",
        });
      }

      const filePathInDb = stipendiat[docType];

      if (!filePathInDb) {
        return res.send({
          ok: false,
          msg: "O'chirish uchun hujjat topilmadi",
        });
      }

      // Diskdagi to'liq yo'lni aniqlash va faylni o'chirish
      const fullFilePath = path.join(__dirname, "..", filePathInDb);
      if (fs.existsSync(fullFilePath)) {
        try {
          fs.unlinkSync(fullFilePath);
        } catch (e) {
          console.error("Faylni o'chirishda xatolik:", e);
        }
      }

      // Bazadagi maydonni tozalaymiz
      stipendiat[docType] = null; // yoki "" (bo'sh satr)
      await stipendiat.save();

      return res.send({
        ok: true,
        msg: "Hujjat muvaffaqiyatli o'chirildi!",
        data: stipendiat,
      });
    } catch (err) {
      console.error("deldocadmin xatolik:", err);
      return res.send({
        ok: false,
        msg: "Hujjatni o'chirishda xatolik yuz berdi",
      });
    }
  }
};
