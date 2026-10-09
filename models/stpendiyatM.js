const mongoose = require("mongoose");

const stipendiatSchema = new mongoose.Schema(
  {
    login: {
      type: String,
      required: [true, "Login kiritilishi shart"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Parol kiritilishi shart"],
      minlength: 6,
    },
    fullName: {
      type: String,
      default: "",
    },
    // 3x4 Rasm URL manzili
    photo3x4: {
      type: String,
      default: "",
    },
    // Profil to'ldirilganlik holati
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    university: { type: String, default: "" },
    fieldOfStudy: { type: String, default: "" },
    degree: {
      type: String,
      enum: ["Bakalavr", "Magistr", "PhD", "Mustaqil izlanuvchi", ""],
      default: "",
    },

    // Universitet kontrakt shartnomasi (URL)
    contractAgreement: {
      type: String,
      default: "",
    },
    // Fond to'lov cheki (URL)
    paymentReceipt: {
      type: String,
      default: "",
    },

    // Talaba yuklaydigan rasmiy va tasdiqlovchi hujjatlar (URL manzil ko'rinishida)
    documents: {
      residenceCertificate: { type: String, default: "" }, // Yashash joyidan ma'lumotnoma
      studyCertificate: { type: String, default: "" },     // O'qish joyidan ma'lumotnoma
      familyCertificate: { type: String, default: "" },    // Oila a'zolari haqida ma'lumotnoma
      passportCopy: { type: String, default: "" },         // Pasport nusxasi
      motivationLetter: { type: String, default: "" },     // Yuklagan motivatsion xati
      objectiveSheet: { type: String, default: "" },       // Ma'lumotnoma (namunaviy obyektivka)
      schoolDiploma: { type: String, default: "" },        // Shahodatnoma
      transcript: { type: String, default: "" },           // Transkript
      dtmResult: { type: String, default: "" },            // DTM natijasi
      ieltsCertificate: { type: String, default: "" },     // IELTS sertifikati
      cefrCertificate: { type: String, default: "" },      // CEFR sertifikati
      achievementsProof: { type: String, default: "" },    // Yutuqlar (sertifikatlar va b.)
      motivationProof: { type: String, default: "" },      // Motivatsion xatda aytilgan ma'lumotlar isboti
    },

    achievements: [
      {
        title: { type: String },
        year: { type: Number },
        description: { type: String },
        certificateUrl: { type: String },
      },
    ],
    stipendAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "suspended", "graduated"],
      default: "active",
    },
    type:String,
    category:{
      type:String,
      default:"none"
    },
    enteredYear:{
      type:Number,
      default: new Date().getFullYear()
    },
    access_token: String,
    freeze:{type:Boolean,default:false}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stipendiat", stipendiatSchema);