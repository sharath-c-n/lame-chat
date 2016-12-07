var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Userschema = new mongoose.Schema({
    email:{
        type:String,
        lowercase:true,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:['Admin','User'],
        default:'User'
    },
    name : {
        type: String,
        required:false,
        unique:true
    }
});


//Save the user's hash password
Userschema.pre('save',function(next){
    var  user= this;
    if(this.isModified('password')||this.isNew){
        bcrypt.genSalt(10,function(err,salt){
            if(err){
                return next(err);
            }
        bcrypt.hash(user.password,salt,null,function(err,hash){
            if(err){
                return next(err);
            }
            user.password=hash;
            next();
        })
        })
    }
    else{
        return next();
    }
});

//It will validate an already existing password
Userschema.methods.comparePassword= function(pw,cb){
    bcrypt.compare(pw,this.password,function(err,isMatch){
        if(err){
            return cb(err);
        }
        cb(null,isMatch);
    });
};

module.exports= mongoose.model('User',Userschema);