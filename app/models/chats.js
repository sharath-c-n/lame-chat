var mongoose = require('mongoose');

var ChatSchema = new mongoose.Schema({
    type: {
        type :String,
        required : true
    },
    participants :{
        type :[],
        required : false
    },
    chatHistory: [{
        _id: {
            type: Date,
            required: true
        },
        from :{
            type :String,
            require:true
        },
        message: {
            type: String
        }
    }],
    lastUpdate : {
        type : Date,
        required : true
    }
});

module.exports = mongoose.model('chats', ChatSchema);