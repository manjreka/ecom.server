const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    title: {type: String, required: true},
    brand: {type: String, required: true},
    price: {type: Number, required: true},
    id: {type: Number, required: true},
    imageUrl: {type: String, required: true},
    rating: {type: String, required: true}
})

const product = mongoose.model('product', productSchema)

module.exports = product

