// models/users.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    nombre: {
        type: String,
        required: true
    },
    apellidos: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // --- NUEVO CAMPO AGREGADO ---
    role: {
        type: String,
        enum: ['user', 'admin'], // Solo permite estos dos valores exactos
        default: 'user'          // Si no se especifica, será 'user' (usuario normal)
    },
    // ----------------------------
    patientDetails: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientDetails' }
}, { timestamps: true });

// PRE-HOOK: Hashear y salting a la contraseña antes de guardar el documento
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;