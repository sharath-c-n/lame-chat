var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var User = require('../app/models/user');
var config = require('../config/main');

module.exports = function (passport) {   
    'use strict';
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
    opts.secretOrKey = config.secret;
    passport.use(new JwtStrategy(opts,function (jwt_payload,done) {
        User.findOne({email:jwt_payload.email},function(err,user){
            if(err){ 
                    return done(err,false);
                   }
            if(user){
                done(null,user);
            }
            else{
                done(null,false);
            }
        });
    }));
};