const Period = require('../models/periodM');
const StpApplication = require('../models/stpApplyM');
const fs = require('fs');
const path = require('path');
const md5 = require('md5');
module.exports = {
  // 1. Yangi Period qo'shish
  addpr: async (req, res) => {
    try {
      const { title, startDate, endDate, status } = req.body;

      if (!title || !startDate || !endDate) {
        return res.send({
          ok: false,
          msg: "Title, startDate va endDate maydonlari to'ldirilishi shart!",
        });
      }

      // Agar yangi period statusi 'active' qilib o'rnatilayotgan bo'lsa
      if (status === 'active') {
        const activePeriod = await Period.findOne({ status: 'active' });
        if (activePeriod) {
          return res.send({
            ok: false,
            msg: "Allaqachon faol (active) bo'lgan period mavjud! Avval uni arxivlang.",
          });
        }
      }

      const newPeriod = new Period({
        title,
        startDate,
        endDate,
        status: status || 'draft'
      });

      const savedPeriod = await newPeriod.save();

      return res.send({
        ok: true,
        msg: "Period muvaffaqiyatli yaratildi",
        data: savedPeriod,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.send({
          ok: false,
          msg: "Bir vaqtning o'zida faqat bitta 'active' period bo'lishi mumkin!",
        });
      }
      return res.send({
        ok: false,
        msg: err.message || "Period yaratishda xatolik yuz berdi",
      });
    }
  },
  // 2. Periodni tahrirlash
  editpr: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (!id) {
        return res.send({ ok: false, msg: "Period ID ko'rsatilmadi!" });
      }

      // Active statusga o'tkazilayotgan bo'lsa, boshqa active period yo'qligini tekshirish
      if (updateData.status === 'active') {
        const activePeriod = await Period.findOne({ status: 'active', _id: { $ne: id } });
        if (activePeriod) {
          return res.send({
            ok: false,
            msg: "Boshqa faol (active) period mavjud! Avval uni arxivlang.",
          });
        }
      }

      const updatedPeriod = await Period.findByIdAndUpdate(
        id,
        updateData,
        { returnDocument: 'after', runValidators: true }
      );

      if (!updatedPeriod) {
        return res.send({ ok: false, msg: "Period topilmadi!" });
      }

      return res.send({
        ok: true,
        msg: "Period muvaffaqiyatli tahrirlandi",
        data: updatedPeriod,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.send({
          ok: false,
          msg: "Bir vaqtning o'zida faqat bitta 'active' period bo'lishi mumkin!",
        });
      }
      return res.send({
        ok: false,
        msg: err.message || "Periodni tahrirlashda xatolik yuz berdi",
      });
    }
  },

  // 3. Periodni o'chirish
  delpr: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.send({ ok: false, msg: "ID ko'rsatilmadi!" });
      }

      const deletedPeriod = await Period.findByIdAndDelete(id);

      if (!deletedPeriod) {
        return res.send({ ok: false, msg: "Period topilmadi yoki allaqachon o'chirilgan!" });
      }

      return res.send({
        ok: true,
        msg: "Period muvaffaqiyatli o'chirildi",
      });
    } catch (err) {
      return res.send({
        ok: false,
        msg: err.message || "Periodni o'chirishda xatolik yuz berdi",
      });
    }
  },

  // 4. Barcha Periodlarni va ularga biriktirilgan Marking (criteria) larini olish
  getpr: async (req, res) => {
    try {
      const periods = await Period.find()
        .sort({ createdAt: -1 });

      return res.send({
        ok: true,
        data: periods,
      });
    } catch (err) {
      return res.send({
        ok: false,
        msg: err.message || "Periodlarni olishda xatolik yuz berdi",
      });
    }
  },
  getactivepr: async (req, res) => {
    try {
      const periods = await Period.find({ status: "active" })

      return res.send({
        ok: true,
        data: periods,
      });
    } catch (err) {
      return res.send({
        ok: false,
        msg: err.message || "Periodlarni olishda xatolik yuz berdi",
      });
    }
  },

  submitApp: async (req, res) => {
    try {
      const { periodId, markingIds } = req.body;
      // Talaba ID si faqat tokendan olinadi — boshqa talaba nomidan ariza yuborib bo'lmaydi
      const studentId = String(req.user.stpId);

      const files = req.files; // express-fileupload orqali kelgan fayllar
      // 1. Majburiy maydonlar va fayllar mavjudligini tekshirish
      if (!periodId || !studentId) {
        return res.send({
          ok: false,
          msg: "Iltimos, periodId va studentId majburiy maydonlarini yuboring!"
        });
      }

      if (!files || !files.files) {
        return res.send({
          ok: false,
          msg: "Kamida bitta fayl yuklanishi kerak!"
        });
      }

      // 2. markingIds va files kelish shaklini Array ga keltirish
      const markingList = Array.isArray(markingIds) ? markingIds : [markingIds];
      const fileList = Array.isArray(files.files) ? files.files : [files.files];

      // 3. Fayllar soni va markingIds soni mosligini tekshirish
      if (fileList.length !== markingList.length) {
        return res.send({
          ok: false,
          msg: "Har bir faylga mos markingId kelmadi (fayllar va mezonlar soni teng emas)!"
        });
      }

      // 4. Fayllarni tekshirish (Faqat PDF va Max 15MB)
      const maxSize = 15 * 1024 * 1024; // 15 MB
      for (let f of fileList) {
        const ext = path.extname(f.name).toLowerCase();
        if (ext !== '.pdf') {
          return res.send({
            ok: false,
            msg: `Faqat PDF formatdagi fayllar qabul qilinadi! Qabul qilinmadi: ${f.name}`
          });
        }
        if (f.size > maxSize) {
          return res.send({
            ok: false,
            msg: `Fayl hajmi 15MB dan oshmasligi kerak! Fayl: ${f.name}`
          });
        }
      }

      // 5. Har bir ariza/talaba uchun alohida papka yaratish
      // Papka yo'li: ./public/uploads/stp/PERIOD_STUDENT/
      const folderRelativePath = `/public/uploads/stp/${periodId}_${studentId}`;
      const fullFolderPath = path.join(__dirname, '..', folderRelativePath);

      if (!fs.existsSync(fullFolderPath)) {
        fs.mkdirSync(fullFolderPath, { recursive: true });
      }

      // 6. Bazadan arizani topish yoki yangi yaratish
      let application = await StpApplication.findOne({ periodId, studentId });

      if (!application) {
        application = new StpApplication({
          periodId,
          studentId,
          status: 'draft',
          files: []
        });
      }

      // 7. Fayllarni diskka yozish va markingId bilan bog'lab DB ga saqlash
      for (let i = 0; i < fileList.length; i++) {
        const currentFile = fileList[i];
        const currentMarkingId = markingList[i];

        const fileExt = path.extname(currentFile.name).toLowerCase();
        const uniqueFileName = `${md5(currentFile.name + Date.now() + i)}${fileExt}`;

        const fileDbPath = `${folderRelativePath}/${uniqueFileName}`;
        const savePathOnDisk = path.join(__dirname, '..', fileDbPath);

        // Faylni papkaga ko'chirish
        await currentFile.mv(savePathOnDisk);

        // Model ichida ushbu markingId bo'yicha fayl bor-yo'qligini tekshirish
        const existingIndex = application.files.findIndex(
          (item) => item.markingId && item.markingId.toString() === currentMarkingId.toString()
        );

        if (existingIndex > -1) {
          // Eski faylni diskdan o'chirish
          const oldFilePath = application.files[existingIndex].file;
          if (oldFilePath) {
            const oldFullDiskPath = path.join(__dirname, '..', oldFilePath);
            if (fs.existsSync(oldFullDiskPath)) {
              try { fs.unlinkSync(oldFullDiskPath); } catch (e) { }
            }
          }

          // Yangi fayl ma'lumotlarini o'rniga yozish
          application.files[existingIndex].file = fileDbPath;
          application.files[existingIndex].uploadedAt = new Date();
        } else {
          // Yangi fayl obyektini qo'shish
          application.files.push({
            markingId: currentMarkingId,
            file: fileDbPath,
            uploadedAt: new Date()
          });
        }
      }

      // Statusni 'submitted' holatiga o'tkazish
      application.status = 'submitted';
      await application.save();

      return res.send({
        ok: true,
        msg: "Arizangiz va fayllaringiz muvaffaqiyatli saqlandi va topshirildi!",
        data: application
      });

    } catch (err) {
      console.error("submitApp error:", err);
      return res.send({
        ok: false,
        msg: err.message || "Fayllarni saqlashda xatolik yuz berdi!"
      });
    }
  },

  checkActiveApplication: async (req, res) => {
    try {
      const { stpId } = req.user;
      const studentId = stpId
      if (!studentId || studentId === "undefined") {
        return res.send({
          ok: false,
          msg: "studentId yuborilmadi yoki noto'g'ri!"
        });
      }

      // 1. Ayni vaqtda faol (active) bo'lgan davrni bazadan qidiramiz
      const activePeriod = await Period.findOne({ status: 'active' });

      if (!activePeriod) {
        return res.send({
          ok: false,
          hasActivePeriod: false,
          hasSubmitted: false,
          msg: "Hozirda faol ariza topshirish davri mavjud emas."
        });
      }

      // 2. Ushbu faol davr uchun talabaning arizasi bor-yo'qligini tekshiramiz
      const application = await StpApplication.findOne({
        periodId: activePeriod._id,
        studentId: studentId
      })
        .populate('files.markingId')
        .populate('periodId');

      if (!application) {
        return res.send({
          ok: true,
          hasActivePeriod: true,
          hasSubmitted: false,
          activePeriod: activePeriod, // Frontend uchun faol davr ma'lumotlari
          msg: "Faol davr mavjud, lekin ariza topshirilmagan."
        });
      }

      // 3. Ariza topildi
      return res.send({
        ok: true,
        hasActivePeriod: true,
        hasSubmitted: true,
        data: application,
        msg: "Mavjud ariza topildi!"
      });

    } catch (err) {
      console.error("checkActiveApplication error:", err);
      return res.send({
        ok: false,
        msg: err.message || "Serverda xatolik yuz berdi!"
      });
    }
  },
  getApplicationsByPeriod: async (req, res) => {
    try {
      const { periodId } = req.params;

      const applications = await StpApplication.find({ periodId })
        .populate('files.markingId')
        .populate('periodId')
        .sort({ createdAt: -1 });

      return res.send({
        ok: true,
        count: applications.length,
        data: applications
      });
    } catch (err) {
      console.error("getApplicationsByPeriod error:", err);
      return res.send({ ok: false, msg: err.message || "Serverda xatolik!" });
    }
  },
  // 2. Barcha arizalar ro'yxatini olish (Filtrlar bilan: status, periodId)
  getAllApplicationsForAdmin: async (req, res) => {
    try {
      const { periodId, status } = req.body;
      let filter = {};

      if (periodId) filter.periodId = periodId;
      if (status) filter.status = status;

      const applications = await StpApplication.find(filter)
        .populate('files.markingId')
        .populate('periodId')
        .sort({ createdAt: -1 });

      return res.send({
        ok: true,
        count: applications.length,
        data: applications
      });
    } catch (err) {
      console.error("getAllApplicationsForAdmin error:", err);
      return res.send({ ok: false, msg: err.message || "Serverda xatolik!" });
    }
  },
  // 3. ID bo'yicha bitta arizani to'liq ko'rish
  getApplicationById: async (req, res) => {
    try {
      const { id } = req.params;

      const application = await StpApplication.findById(id)
        .populate('files.markingId')
        .populate('periodId');

      if (!application) {
        return res.send({ ok: false, msg: "Ariza topilmadi!" });
      }

      return res.send({ ok: true, data: application });
    } catch (err) {
      console.error("getApplicationById error:", err);
      return res.send({ ok: false, msg: err.message });
    }
  },

  // 4. Arizaga ball qo'yish va admin izohini saqlash (Grade Application)
  gradeApplication: async (req, res) => {
    try {
      const { applicationId } = req.params;
      const expertId = req.user?.adminId;
      const { grades, status } = req.body;
      const application = await StpApplication.findById(applicationId);

      if (!application) {
        return res.send({ ok: false, msg: "Ariza topilmadi!" });
      }

      // whomark String sifatida saqlanadi, expertId esa ObjectId — solishtirish uchun String ga keltiramiz
      const currentExpert = String(expertId);

      // 1. Fayllar bo'yicha ball va izohlarni scoreSchema strukturasiga mos saqlash
      if (Array.isArray(grades) && Array.isArray(application.files)) {
        grades.forEach((g) => {
          // Frontend'dan fileId sifatida f._id yoki f.markingId kelishiga moslashuvchan qidiruv
          const fileIndex = application.files.findIndex((f) => {
            const isFileIdMatch = f?._id.toString() === g.fileId;

            return isFileIdMatch;
          });

          if (fileIndex !== -1) {
            const currentFile = application.files[fileIndex];

            // score massivini xavfsizlantirish
            if (currentFile.score === undefined || !Array.isArray(currentFile.score)) {
              currentFile.score = [];
            }

            // Ekspert avval baholagan-baholamaganini aniqlash
            const existingScoreIndex = currentFile.score.findIndex(
              (s) => s.whomark === currentExpert
            );

            if (existingScoreIndex !== -1) {
              // 1-HOLAT: Mavjud ekspertning mark va adminComment ma'lumotlarini yangilaymiz
              if (g.score !== undefined && g.score !== null) {
                currentFile.score[existingScoreIndex].mark = Number(g.score);
              }
              if (g.adminComment !== undefined) {
                currentFile.score[existingScoreIndex].adminComment = g.adminComment;
              }
            } else {
              // 2-HOLAT: Yangi scoreSchema obyekti sifatida push qilamiz
              currentFile.score.push({
                mark: g.score !== undefined && g.score !== null ? Number(g.score) : 0,
                whomark: currentExpert,
                adminComment: g.adminComment || "",
              });
            }
          }
        });
      }

      // 2. Statusni yangilash
      application.status = status || "reviewed";
      application.files.forEach((file) => {
        // Har bir fayl uchun totalScore hisoblash
        const totalFileScore =
          file.score && file.score.length > 0
            ? file.score.reduce((acc, s) => acc + (s.mark || 0), 0) / file.score.length
            : 0;
        file.totalScore = totalFileScore;
      });

      // Ariza bo'yicha umumiy totalScore hisoblash
      const totalApplicationScore = application.files.reduce((acc, f) => acc + (f.totalScore || 0), 0);
      application.totalScore = totalApplicationScore;
      // 3. O'zgarishlarni bazaga saqlash
      await application.save();
      // Population va javob
      const updatedApp = await StpApplication.findById(applicationId)
        .populate("files.markingId")
        .populate("periodId");

      return res.send({
        ok: true,
        msg: "Ariza muvaffaqiyatli baholandi!",
        data: updatedApp,
      });
    } catch (err) {
      console.error("gradeApplication error:", err);
      return res.send({
        ok: false,
        msg: err.message || "Baholashda xatolik yuz berdi!",
      });
    }
  },

  // 5. Ariza statusini o'zgartirish (approved, rejected, reviewed, submitted)
  updateApplicationStatus: async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { status } = req.body;

      if (!['submitted', 'reviewed', 'approved', 'rejected'].includes(status)) {
        return res.send({ ok: false, msg: "Noto'g'ri status kiritildi!" });
      }

      const application = await StpApplication.findByIdAndUpdate(
        applicationId,
        { status },
        { returnDocument: 'after' }
      );

      if (!application) {
        return res.send({ ok: false, msg: "Ariza topilmadi!" });
      }

      return res.send({
        ok: true,
        msg: "Ariza holati yangilandi!",
        data: application
      });

    } catch (err) {
      console.error("updateApplicationStatus error:", err);
      return res.send({ ok: false, msg: err.message });
    }
  },

  // 6. Arizani va unga tegishli fayllar papkasini o'chirish
  deleteApplication: async (req, res) => {
    try {
      const application = await StpApplication.findByIdAndDelete(req.params.id);

      if (!application) {
        return res.send({ ok: false, msg: "Ariza topilmadi!" });
      }

      const folderPath = path.join(__dirname, '..', `/public/uploads/stp/${application.periodId}_${application.studentId}`);
      if (fs.existsSync(folderPath)) {
        try { fs.rmSync(folderPath, { recursive: true, force: true }); } catch (e) { }
      }

      return res.send({ ok: true, msg: "Ariza va fayllari o'chirildi!" });
    } catch (err) {
      console.error("deleteApplication error:", err);
      return res.send({ ok: false, msg: err.message });
    }
  }
};