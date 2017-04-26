const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const {SECRET} = require('../config/config');

const userSchema = mongoose.Schema({
  username: {type: String, required: [true, "can't be blank"], index: true, unique: true},
  email: {type: String, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true, unique: true},
  hash: String,
  salt: String
}, {timestamps: true});

userSchema.methods.apiRepr = function() {

  return {
    id: this._id,
    username: this.username,
    email: this.email,
    timestamps: this.timestamps
  };
}

userSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

userSchema.methods.generateJWT = function() {
  var today = new Date();
  var exp = new Date(today);
  //jwt will expire in 60 days
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, secret);
};

userSchema.methods.toAuthJSON = function(){
  return {
    username: this.username,
    email: this.email,
    token: this.generateJWT()
  };
};


userSchema.plugin(uniqueValidator);
const User = mongoose.model('User', userSchema);

module.exports = {User};
