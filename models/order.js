const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  orderNumber: {
    type: Number,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  phone: {
    type: Number,
    required: true
  },
  notes:{
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: Number,
    required: true,
    default: 1
  },
  products: [
    {
      product: { type: Object, required: true },
      quantity: { type: Number, required: true },
      size: { type: String }
    }
  ],
  user: {
    email: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', orderSchema);
