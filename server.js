var express = require('express');
var mongoose = require('mongoose');
var path = require('path');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var process = require("process");
var passport = require('passport');
var config = require('./config/main');
var User = require('./app/models/user');
var Chats = require('./app/models/chats');
var chat = require('./src/app');
var http = require('http');
var jwt = require('jsonwebtoken');
var dbUtil = require('./src/dbUtil');
var port = process.env.PORT || 3000;


app = express();
//used to parse the POST request body 
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//logs the request to the console
app.use(morgan('dev'));

//Initialise passport for use
app.use(passport.initialize());

//to connect to the DB
mongoose.connect(config.database, {mongos: false}, function (err) {
    if (err) {
        console.log("Error while connecting to DB!!!!!", err);
    }
    else {
        console.log("Connected to db...");
        dbUtil.createChatHist();
    }
});

//Bring in the passport stratergy that has been defined
require('./config/passport')(passport);

//Create api routes 
var apiRoutes = express.Router();
//Register new users
apiRoutes.post('/register', function (req, res) {
    if (!req.body.email || !req.body.password) {
        res.status(409).json({success: false, messages: 'Please enter an email and password to register'});
    }
    else {
        var newUser = new User({
            email: req.body.email,
            password: req.body.password,
            name : req.body.name
        });
        //save the new User in the db
        newUser.save(function (err) {
            if (err) {
                console.log(err);
                return res.json({success: false, message: 'Email address already exists'})
            }
            res.json({success: true, message: 'Successful user creation'});
        });

    }
});

//app.use('/api',apiRoutes);

//Authenticate the user and get a JWT
apiRoutes.post('/authenticate', function (req, res) {
    User.findOne({
        email: req.body.email
    }, function (err, user) {
        if (err) throw err;
        if (!user) {
            res.status(401).send({success: false, message: 'authentication failed .User not found'});
        }
        else {
            //check if the password matches
            user.comparePassword(req.body.password, function (err, isMatch) {
                if (isMatch && !err) {
                    var tempUser = {
                        _id: user._id,
                        email: user.email,
                        role: user.role
                    };
                    var token = jwt.sign(tempUser, config.secret, {
                        expiresIn: 3600//in seconds i.e an hour
                    });
                    res.json({success: true, token: 'JWT ' + token});
                }
                else {
                    res.status(401).send({success: false, message: 'Authentication failed .Passwords did not match'});
                }
            });
        }
    });
});

apiRoutes.get('/chatList', passport.authenticate('jwt', {session: false}), function (req, res) {
   dbUtil.createChatMap(req.user._id,res);
});

apiRoutes.get('/chatHist/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
    Chats.findOne({_id: mongoose.mongo.ObjectId(req.params.id)}, function (err, chatHist) {
        if (err) throw err;
        if (chatHist) {
            res.status(200).send(chatHist);
        }
        else {
            Chats.find({}, function (err, data) {
                console.log(data);
            });
            res.status(404);
        }
    });
});

//Set url for API group routes
app.use('/api', apiRoutes);
app.use('/', express.static(path.join(__dirname, 'public')));


app.on('error', onError);
app.on('listening', onListening);


function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;

        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;

        default:
            throw error;
    }
}

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('start' + 'Listening at ' + bind);
}
var server = http.createServer(app);
chat.installHandlers(server, {prefix: '/socket'});
server.listen(port);
console.log('your server is running on this port ' + port);