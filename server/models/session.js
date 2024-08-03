const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema({
    loginTime: {type: Date, required: true},
    logoutTime: {type: Date},
    ipAddress: {type: String, required: true},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true}
})

const session  = mongoose.model('session', sessionSchema)

module.exports  = session