/**
 * Created by shara on 02/12/2016.
 */
var mongoose = require('mongoose');
var ChatMap = require('./models/chatMap');
var Chats = require('./models/chats');
var config = require('./config/main');


var dbUtil = {
    /**
     * Creates Chat Map for user if not present
     * @param user_id : id of the user
     * @res response object : will return the chatMap object
     */
    createChatMap : function(user_id,res){
        ChatMap.findOne({user_id: user_id}, function (err, map) {
            if (err) {
                res.status(404).send();
                throw err;
            }
            if (!map) {
                var newMap = new ChatMap({
                    _id: user_id,
                    chat_ids: [{
                        chat_id: new mongoose.mongo.ObjectId(config.defChatId),
                        lastSync: null
                    }]
                });
                newMap.save(function (err) {
                    if (err) {
                        console.log("Error while creating chatMap");
                        console.log(err);
                    }
                    res.status(200).send(newMap);
                });
            }
            else {
                res.status(200).send(map);
            }
        });
    },
    /**
     * Creates the chats table for default chat Id if it doesn't exists
     */
    createChatHist : function () {
        Chats.findOne({_id: mongoose.mongo.ObjectId(config.defChatId)}, function (err, map) {
        if (err) throw err;
        if (!map) {
            var chatDef = new Chats({
                _id: new mongoose.mongo.ObjectId(config.defChatId),
                chatHistory: [],
                type: 'group',
                lastUpdate: Date.now()
            });
            chatDef.save(function (err) {
                if (err) {
                    console.log("Error creating default Chat ID");
                    console.log(err);
                }
                else {
                    console.log("Created default ID");
                }
            });
        }
    });
    }
};

module.exports = dbUtil;