const Xronology = require('../models/historyM'); // Model yo'lini loyihangizga moslab oling
const Marking = require('../models/markingM'); // Model yo'lini loyihangizga moslab oling
const fs = require('fs');
const md5 = require('md5');
module.exports={
    addhistory: async (req, res) => {
    try {
      // express-fileupload'da matnli ma'lumotlar req.body ichida keladi
      const { date, action } = req.body;
      const files = req.files;

      // Majburiy matnli maydonlarni tekshirish
      if (!date || !action) {
        return res.send({
          ok: false,
          msg: "Iltimos, barcha majburiy matnli maydonlarni to'ldiring (date, action)!"
        });
      }

      // Majburiy photo fayli kelganini tekshirish
      if (!files || !files.photo) {
        return res.send({
          ok: false,
          msg: "Iltimos, xronologiya uchun rasm faylini (photo) yuklang!"
        });
      }

      // Papka mavjudligini tekshirish, bo'lmasa yaratish
      const dirPath = './public/xronology';
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Rasm uchun unikal nom va saqlash yo'li
      const imageExtension = files.photo.name.split('.').pop();
      const photoPath = `/public/xronology/${md5(files.photo.name + new Date())}.${imageExtension}`;

      // Bazaga saqlash
      const newItem = new Xronology({
        date,
        action,
        photo: photoPath
      });

      const savedItem = await newItem.save();

      // Rasm faylini server xotirasiga ko'chirish
      await files.photo.mv(`.${photoPath}`);

      return res.send({
        ok: true,
        msg: "Xronologiya muvaffaqiyatli qo'shildi va rasm serverga yuklandi!",
        data: savedItem
      });

    } catch (err) {
      console.error("add Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Xronologiyani saqlashda kutilmagan xatolik yuz berdi."
      });
    }
  },
  // 2. Barcha xronologiyalarni olish
  getallhistory: async (req, res) => {
    try {
      // Sanasi bo'yicha kamayish tartibida olish
      const items = await Xronology.find().sort({ _id: -1 });

      if (!items || items.length === 0) {
        return res.send({
          ok: true,
          msg: "Hozircha hech qanday xronologiya mavjud emas.",
          data: []
        });
      }

      return res.send({
        ok: true,
        msg: "Barcha xronologiyalar muvaffaqiyatli yuklandi!",
        count: items.length,
        data: items
      });

    } catch (err) {
      console.error("getall Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Xronologiyalarni yuklashda kutilmagan xatolik yuz berdi."
      });
    }
  },
  // 3. Tahrirlash
  edithistory: async (req, res) => {
    try {
      const { id } = req.params; // /api/xronology/:id
      const { date, action } = req.body;
      const files = req.files;

      // Bazada borligini tekshirish
      const existingItem = await Xronology.findById(id);
      if (!existingItem) {
        return res.send({
          ok: false,
          msg: "Tahrirlanadigan xronologiya topilmadi!"
        });
      }

      // Majburiy matnli maydonlarni tekshirish
      if (!date || !action) {
        return res.send({
          ok: false,
          msg: "Iltimos, barcha majburiy matnli maydonlarni to'ldiring (date, action)!"
        });
      }

      let photoPath = existingItem.photo;

      // Agar yangi rasm yuklangan bo'lsa
      if (files && files.photo) {
        // Eski rasmni o'chirish
        if (existingItem.photo && fs.existsSync(`.${existingItem.photo}`)) {
          fs.unlinkSync(`.${existingItem.photo}`);
        }

        // Papkani tekshirish
        const dirPath = './public/xronology';
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        // Yangi rasm nomi va saqlash yo'li
        const imageExtension = files.photo.name.split('.').pop();
        photoPath = `/public/xronology/${md5(files.photo.name + new Date())}.${imageExtension}`;

        // Serverga yuklash
        await files.photo.mv(`.${photoPath}`);
      }

      // Ma'lumotlarni yangilash
      existingItem.date = date;
      existingItem.action = action;
      existingItem.photo = photoPath;

      const updatedItem = await existingItem.save();

      return res.send({
        ok: true,
        msg: "Xronologiya muvaffaqiyatli tahrirlandi!",
        data: updatedItem
      });

    } catch (err) {
      console.error("edit Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Xronologiyani tahrirlashda kutilmagan xatolik yuz berdi."
      });
    }
  },
  // 4. O'chirish
  deletehistory: async (req, res) => {
    try {
      const { id } = req.params; // /api/xronology/:id

      const existingItem = await Xronology.findById(id);
      if (!existingItem) {
        return res.send({
          ok: false,
          msg: "O'chirilishi kerak bo'lgan xronologiya topilmadi!"
        });
      }

      // Rasm faylini o'chirish
      if (existingItem.photo && fs.existsSync(`.${existingItem.photo}`)) {
        try {
          fs.unlinkSync(`.${existingItem.photo}`);
        } catch (fileErr) {
          console.error("Faylni o'chirishda xatolik yuz berdi:", fileErr.message);
        }
      }

      // Bazadan o'chirish
      await Xronology.findByIdAndDelete(id);

      return res.send({
        ok: true,
        msg: "Xronologiya va unga tegishli rasm fayli muvaffaqiyatli o'chirildi!"
      });

    } catch (err) {
      console.error("delete Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Xronologiyani o'chirishda kutilmagan xatolik yuz berdi."
      });
    }
  },
    addmark: async (req, res) => {
    try {
      const { order, title, paragraph, mark, color, accept } = req.body;

      if (!title || !paragraph) {
        return res.send({
          ok: false,
          msg: "Iltimos, majburiy maydonlarni (title, paragraph) to'ldiring!"
        });
      }

      const newMarking = new Marking({
        order,
        title,
        paragraph,
        mark,
        color,
        accept
      });

      const savedMarking = await newMarking.save();

      return res.send({
        ok: true,
        msg: "Marking muvaffaqiyatli qo'shildi!",
        data: savedMarking
      });

    } catch (err) {
      console.error("add Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Marking qo'shishda xatolik yuz berdi."
      });
    }
  },

  // 2. Barcha markinglarni olish
  getallmark: async (req, res) => {
    try {
      // Target tartibida (order bo'yicha) saralab olish
      const items = await Marking.find().sort({ order: 1 });

      return res.send({
        ok: true,
        msg: "Barcha markinglar muvaffaqiyatli yuklandi! ",
        count: items.length,
        data: items
      });

    } catch (err) {
      console.error("getall Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Markinglarni yuklashda xatolik yuz berdi."
      });
    }
  },

  // 3. Tahrirlash
  editmark: async (req, res) => {
    try {
      const { id } = req.params; // /api/marking/edit/:id
      const updateData = { ...req.body };

      if (!id) {
        return res.send({
          ok: false,
          msg: "Marking ID si ko'rsatilmadi!"
        });
      }

      const updatedItem = await Marking.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedItem) {
        return res.send({
          ok: false,
          msg: "Marking topilmadi!"
        });
      }

      return res.send({
        ok: true,
        msg: "Marking muvaffaqiyatli tahrirlandi!",
        data: updatedItem
      });

    } catch (err) {
      console.error("edit Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Markingni tahrirlashda xatolik yuz berdi."
      });
    }
  },

  // 4. O'chirish
  deletemark: async (req, res) => {
    try {
      const { id } = req.params; // /api/marking/delete/:id

      if (!id) {
        return res.send({
          ok: false,
          msg: "ID ko'rsatilmadi!"
        });
      }

      const deletedItem = await Marking.findByIdAndDelete(id);

      if (!deletedItem) {
        return res.send({
          ok: false,
          msg: "Marking topilmadi yoki allaqachon o'chirilgan!"
        });
      }

      return res.send({
        ok: true,
        msg: "Marking muvaffaqiyatli o'chirildi!"
      });

    } catch (err) {
      console.error("delete Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Markingni o'chirishda xatolik yuz berdi."
      });
    }
  }
}