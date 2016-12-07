/* Requires */
var s = require('underscore.string');
var mongoose = require('mongoose');
var sockjs = require('sockjs');
var utils = require('./utils.js');
var chats = require('../app/models/chats');
var config = require('../config/main');
var chat = sockjs.createServer();
var clients = [];
var users = {};
var usersSet ;
var gChatInst = null;

var alphanumeric = /^\w+$/;

/* Logic */
chat.on('connection', function(conn) {
    var uid = Date.now();
    clients[conn.id] = {
        id: uid,
        un: null,
        ip: conn.headers['x-forwarded-for'],
        role: 0,
        con: conn
    };

    users[uid] = {
        id: uid,
        oldun: null,
        un: null,
        role: 0
    };
    
   conn.write(JSON.stringify({type:'server', info:'clients', clients:users}));
   conn.write(JSON.stringify({type:'server', info:'user', client:users[uid]}));
    conn.on('data', function(message) {
        try {
                var data = JSON.parse(message);

                if(data.type == 'ping') {
                    return false;
                }
                if(data.type == 'typing') {
                    return utils.sendToAll(clients, {type:'typing', typing:data.typing, user:clients[conn.id].un});
                }

                if(data.type == 'update') {
                    return updateUser(conn.id, data.user);
                }

                if(data.message && data.message .length > 768) {
                    data.message = data.message.substring(0, 768);
                    message = JSON.stringify(data);
                }
                handleSocket(clients[conn.id], message);
            } catch(err) {
                return console.log('error', err);
            }
    });

    conn.on('close', function() {
        utils.sendToAll(clients, {type:'typing', typing:false, user:clients[conn.id].un});
        utils.sendToAll(clients, {type:'server', info:'disconnection', user:users[clients[conn.id].id]});
        delete users[clients[conn.id].id];
        delete clients[conn.id];
    });
});


/* Functions */
function updateUser(id, userObj) {
        clients[id].con.write(JSON.stringify({type:'server', info:'success'}));
        users[clients[id].id].un = userObj.userName;
        users[clients[id].id].id = userObj._id;
        utils.sendToAll(clients, {
            type: 'server',
            info: clients[id].un == null ? 'connection' : 'update',
            user: {
                id: userObj._id,
                oldun: clients[id].un,
                un: userObj.userName,
                role: clients[id].role
            }
        });
        clients[id].un = userObj.userName;
}

function handleSocket(user, message) {
    var data = JSON.parse(message);

    data.id = user.id;
    data.user = user.un;
    data.type = s.escapeHTML(data.type);
    data.message = s.escapeHTML(data.message);
    data.mid = (Math.random() + 1).toString(36).substr(2, 5);

    switch(data.type) {
        case 'pm':
            if(data.extra != data.user && utils.checkUser(clients, data.extra)) {
                utils.sendToOne(clients, users, data, data.extra, 'message');
                data.subtxt = 'PM to ' + data.extra;
                utils.sendBack(clients, data, user);
            } else {
                data.type = 'group';
                data.subtxt = null;
                data.message = utils.checkUser(clients, data.extra) ? 'You can\'t PM yourself' : 'User not found';
                utils.sendBack(clients, data, user);
            }
            break;
        default:
            utils.sendToAll(clients, data);
            sync(data.message,data.user,Date.now());
            break;
    }
}

function sync(message,from,timeStamp){
    var msgObj = {_id:timeStamp,from :from,message : message};
    if(!gChatInst) {
        chats.findById(new mongoose.mongo.ObjectId(config.defChatId), function (err, chat) {
            if (err) {
                console.log(err);
                return;
            }
            gChatInst = chat;
            usersSet = new Set();
            gChatInst.type = "group";
            usersSet.add(gChatInst.participants);
            if(!usersSet.has(from))
            {
                gChatInst.participants.push(from);
            }
            gChatInst.lastUpdate = Date.now();
            gChatInst.chatHistory.push(msgObj);
            gChatInst.save(function (err) {
                if (err) console.log(err);
            });
        });

    }
    else {
        gChatInst.chatHistory.push(msgObj);
        gChatInst.save(function (err) {
            if (err) console.log(err);
        });
    }

}

module.exports= chat;
