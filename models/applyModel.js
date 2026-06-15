const mongoose = require('mongoose');

const SiblingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    birth: { type: String, required: true }
}, { _id: false });

const PassportSchema = new mongoose.Schema({
    passportSeria: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{2}$/, "Pasport seriyasi 2 ta harfdan iborat bo'lishi kerak"]
    },
    passportNumber: {
        type: String,
        required: true,
        trim: true,
        match: [/^\d{7}$/, "Pasport raqami 7 ta raqamdan iborat bo'lishi kerak"]
    },
    jshshir: {
        type: String,
        required: true,
        trim: true,
        match: [/^\d{14}$/, "JShShIR (PINFL) 14 ta raqamdan iborat bo'lishi kerak"]
    },
    givenDate: { type: String, required: true },
    expiresDate: { type: String, required: true },
    givenBy: { type: String, required: true }
}, { _id: false });

// Asosiy Ariza sxemasi
const ApplicationSchema = new mongoose.Schema({
    // YANGI QO'SHILGAN MAYDON:
    usernameId: { type: String, required: true, trim: true },

    studentFullName: { type: String, required: true, trim: true },
    birthDate: { type: String, required: true },
    nationality: { type: String, required: true, default: "O'zbekiston" },
    permanentAddress: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    emailAddress: { type: String, required: true, trim: true },
    passportDetails: { type: PassportSchema, required: true },
    universityName: { type: String, required: true },
    studyForm: { type: String, required: true },
    studyField: { type: String, required: true },
    currentCourse: { type: String, required: true },
    isDoingResearch: { type: Boolean, default: false },
    researchDetails: { type: String, default: "" },
    hasConferenceParticipation: { type: Boolean, default: false },
    hasPublications: { type: Boolean, default: false },
    usedPreviousGrants: { type: Boolean, default: false },
    previousGrantDetails: { type: String, default: "" },
    contractAmount: { type: String, required: true },
    familyMembersCount: { type: Number, required: true },

    fatherFullName: { type: String, default: "" },
    fatherWorkPlace: { type: String, default: "" },
    fatherPosition: { type: String, default: "" },
    fatherBirthDate: { type: String, default: "" },
    motherFullName: { type: String, default: "" },
    motherWorkPlace: { type: String, default: "" },
    motherPosition: { type: String, default: "" },
    motherBirthDate: { type: String, default: "" },

    siblings: [SiblingSchema],

    motivationLetter: { type: String, required: true, trim: true },

    cvFile: { type: String, required: true },
    gpaFile: { type: String, required: true },
    universityCertificate: { type: String, required: true },
    passportFile: { type: String, required: true },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Application = mongoose.model('Application', ApplicationSchema);
module.exports = Application;