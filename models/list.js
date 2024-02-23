const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const listSchema = new Schema({
    type: String,
    items: [{
        name: String,
        completed: Boolean
    }],
    date: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

const List = mongoose.model('List', listSchema);

module.exports = List;
