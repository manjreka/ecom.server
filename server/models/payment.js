const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
    totalAmount: {type: Number,  required: true},
    currency: {type: String, required: true},
    paymentType: {type: String, required: true},
    status: {type: String, required: true}
}, 
{ timestamps: true })

const payment = mongoose.model('payment', paymentSchema)

module.exports = payment