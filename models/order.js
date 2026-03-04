const mongoose = require('mongoose');
const { STRING, NUMBER } = require('sequelize');

const Schema = mongoose.Schema;

const orderSchema = new Schema({

    products: [
        {
            product: {
                id: {
                    type: Schema.Types.ObjectId,
                    required: true
                },
                title: String,
                price: Number
            },
            quantity: {type: Number, required: true}
        }
    ],
    totalPrice: {type: Number, required: true},
    user: {
      email: { type: String, required: true },
      userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
    }
  },
  { timestamps: true } 
);

module.exports = mongoose.model('Order', orderSchema);