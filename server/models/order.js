const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  items: [
    {
      productId: { type: Schema.Types.ObjectId, ref: 'product', required: true },
      quantity: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now }
});

const order = mongoose.model('order', orderSchema);
module.exports = order;
