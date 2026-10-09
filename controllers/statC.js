const statGrowth = require('../models/statGrowth')
const statParts = require('../models/statParts')
const achivment = require('../models/achivment')
module.exports = {
      //Statistiks
  //Stat1
  addstat1: async (req, res) => {
    try {
      const { year, amount } = req.body;

      if (year === undefined || amount === undefined) {
        return res.send({
          ok: false,
          msg: "Iltimos, barcha maydonlarni (year, amount) to'ldiring!"
        });
      }

      const newStat = new statGrowth({
        year: Number(year),
        amount: Number(amount)
      });

      const savedStat = await newStat.save();

      return res.send({
        ok: true,
        msg: "Statistika muvaffaqiyatli qo'shildi!",
        data: savedStat
      });

    } catch (err) {
      console.error("add Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Statistika qo'shishda xatolik yuz berdi."
      });
    }
  },

  // 2. Barchasini olish (getall)
  getallstat1: async (req, res) => {
    try {
      // Yillar bo'yicha o'sish tartibida saralash (year: 1)
      const items = await statGrowth.find().sort({ year: 1 });

      return res.send({
        ok: true,
        msg: "Barcha statistika ma'lumotlari yuklandi!",
        count: items.length,
        data: items
      });

    } catch (err) {
      console.error("getall Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Statistikalarni yuklashda xatolik yuz berdi."
      });
    }
  },

  // 3. Tahrirlash (edit)
  editstat1: async (req, res) => {
    try {
      const { id } = req.params; // /api/stat-growth/edit/:id
      const { year, amount } = req.body;

      if (!id) {
        return res.send({
          ok: false,
          msg: "Statistika ID si ko'rsatilmadi!"
        });
      }

      const updatedItem = await statGrowth.findByIdAndUpdate(
        id,
        {
          ...(year !== undefined && { year: Number(year) }),
          ...(amount !== undefined && { amount: Number(amount) })
        },
        { new: true, runValidators: true }
      );

      if (!updatedItem) {
        return res.send({
          ok: false,
          msg: "Statistika topilmadi!"
        });
      }

      return res.send({
        ok: true,
        msg: "Statistika muvaffaqiyatli tahrirlandi!",
        data: updatedItem
      });

    } catch (err) {
      console.error("edit Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Statistikani tahrirlashda xatolik yuz berdi."
      });
    }
  },

  // 4. O'chirish (delete)
  deletestat1: async (req, res) => {
    try {
      const { id } = req.params; // /api/stat-growth/delete/:id

      if (!id) {
        return res.send({
          ok: false,
          msg: "ID ko'rsatilmadi!"
        });
      }

      const deletedItem = await statGrowth.findByIdAndDelete(id);

      if (!deletedItem) {
        return res.send({
          ok: false,
          msg: "Statistika topilmadi yoki allaqachon o'chirilgan!"
        });
      }

      return res.send({
        ok: true,
        msg: "Statistika muvaffaqiyatli o'chirildi!"
      });

    } catch (err) {
      console.error("delete Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Statistikani o'chirishda xatolik yuz berdi."
      });
    }
  },

  //Stat2

  // 1. Qo'shish (add)
  addstat2: async (req, res) => {
    try {
      const { year, first, second, third, amount } = req.body;

      if (year === undefined) {
        return res.send({
          ok: false,
          msg: "Iltimos, yil (year) maydonini to'ldiring!"
        });
      }

      const newStatPart = new statParts({
        year: Number(year),
        first: Number(first || 0),
        second: Number(second || 0),
        third: Number(third || 0),
        amount: Number(amount || 0)
      });

      const savedStatPart = await newStatPart.save();

      return res.send({
        ok: true,
        msg: "Statistika muvaffaqiyatli qo'shildi!",
        data: savedStatPart
      });

    } catch (err) {
      console.error("add Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Statistika qo'shishda xatolik yuz berdi."
      });
    }
  },

  // 2. Barchasini olish (getall)
  getallstat2: async (req, res) => {
    try {
      // Yillar bo'yicha o'sish tartibida saralash (year: 1)
      const items = await statParts.find().sort({ year: 1 });

      return res.send({
        ok: true,
        msg: "Barcha statistika ma'lumotlari yuklandi!",
        count: items.length,
        data: items
      });

    } catch (err) {
      console.error("getall Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Statistikalarni yuklashda xatolik yuz berdi."
      });
    }
  },

  // 3. Tahrirlash (edit)
  editstat2: async (req, res) => {
    try {
      const { id } = req.params; // /api/stat-parts/edit/:id
      const { year, first, second, third, amount } = req.body;

      if (!id) {
        return res.send({
          ok: false,
          msg: "Statistika ID si ko'rsatilmadi!"
        });
      }

      const updateData = {};
      if (year !== undefined) updateData.year = Number(year);
      if (first !== undefined) updateData.first = Number(first);
      if (second !== undefined) updateData.second = Number(second);
      if (third !== undefined) updateData.third = Number(third);
      if (amount !== undefined) updateData.amount = Number(amount);

      const updatedItem = await statParts.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedItem) {
        return res.send({
          ok: false,
          msg: "Statistika topilmadi!"
        });
      }

      return res.send({
        ok: true,
        msg: "Statistika muvaffaqiyatli tahrirlandi!",
        data: updatedItem
      });

    } catch (err) {
      console.error("edit Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Statistikani tahrirlashda xatolik yuz berdi."
      });
    }
  },

  // 4. O'chirish (delete)
  deletestat2: async (req, res) => {
    try {
      const { id } = req.params; // /api/stat-parts/delete/:id

      if (!id) {
        return res.send({
          ok: false,
          msg: "ID ko'rsatilmadi!"
        });
      }

      const deletedItem = await statParts.findByIdAndDelete(id);

      if (!deletedItem) {
        return res.send({
          ok: false,
          msg: "Statistika topilmadi yoki allaqachon o'chirilgan!"
        });
      }

      return res.send({
        ok: true,
        msg: "Statistika muvaffaqiyatli o'chirildi!"
      });

    } catch (err) {
      console.error("delete Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Statistikani o'chirishda xatolik yuz berdi."
      });
    }
  },

  //Stat3

  // 1. Qo'shish (add)
  addstat3: async (req, res) => {
    try {
      const { name, amount } = req.body;

      if (!name) {
        return res.send({
          ok: false,
          msg: "Iltimos, yutuq nomini (name) kiriting!"
        });
      }

      const newAchivment = new achivment({
        name,
        amount: Number(amount || 0)
      });

      const savedAchivment = await newAchivment.save();

      return res.send({
        ok: true,
        msg: "Yutuq muvaffaqiyatli qo'shildi!",
        data: savedAchivment
      });

    } catch (err) {
      console.error("add Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Yutuq qo'shishda xatolik yuz berdi."
      });
    }
  },

  // 2. Barchasini olish (getall)
  getallstat3: async (req, res) => {
    try {
      const items = await achivment.find();

      return res.send({
        ok: true,
        msg: "Barcha yutuqlar muvaffaqiyatli yuklandi!",
        count: items.length,
        data: items
      });

    } catch (err) {
      console.error("getall Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Yutuqlarni yuklashda xatolik yuz berdi."
      });
    }
  },

  // 3. Tahrirlash (edit)
  editstat3: async (req, res) => {
    try {
      const { id } = req.params; // /api/achivment/edit/:id
      const { name, amount } = req.body;

      if (!id) {
        return res.send({
          ok: false,
          msg: "Yutuq ID si ko'rsatilmadi!"
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (amount !== undefined) updateData.amount = Number(amount);

      const updatedItem = await achivment.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedItem) {
        return res.send({
          ok: false,
          msg: "Yutuq topilmadi!"
        });
      }

      return res.send({
        ok: true,
        msg: "Yutuq muvaffaqiyatli tahrirlandi!",
        data: updatedItem
      });

    } catch (err) {
      console.error("edit Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Yutuqni tahrirlashda xatolik yuz berdi."
      });
    }
  },

  // 4. O'chirish (delete)
  deletestat3: async (req, res) => {
    try {
      const { id } = req.params; // /api/achivment/delete/:id

      if (!id) {
        return res.send({
          ok: false,
          msg: "ID ko'rsatilmadi!"
        });
      }

      const deletedItem = await achivment.findByIdAndDelete(id);

      if (!deletedItem) {
        return res.send({
          ok: false,
          msg: "Yutuq topilmadi yoki allaqachon o'chirilgan!"
        });
      }

      return res.send({
        ok: true,
        msg: "Yutuq muvaffaqiyatli o'chirildi!"
      });

    } catch (err) {
      console.error("delete Controllerda xatolik:", err);
      return res.send({
        ok: false,
        msg: err.message || "Yutuqni o'chirishda xatolik yuz berdi."
      });
    }
  }
}