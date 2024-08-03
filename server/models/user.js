const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true },
    password: {type: String, required: true},
    confirmPassword: {type: String, required: true},
    role: {type: String, default: 'Customer'}
})

const user = mongoose.model('user', userSchema)

module.exports = user