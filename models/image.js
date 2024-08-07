const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const imageSchema = new Schema({
    image: {
        type: String,
        required: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Image', imageSchema);


