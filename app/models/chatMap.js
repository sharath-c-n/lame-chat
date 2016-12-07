var mongoose = require('mongoose');

var chatMap = new mongoose.Schema({
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        chat_ids: [{
            chat_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'chats'
            },
            lastSync: {
                type: mongoose.Schema.Types.Date
            }
        }]
});

module.exports= mongoose.model('chatMap',chatMap);