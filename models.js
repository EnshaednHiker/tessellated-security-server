const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const {SECRET} = require('./config');




const deviceSchema = mongoose.Schema({
  deviceName: {type: String, required: [true, "can't be blank"], unique: true},
  deviceToken: String
}, {timestamps: true});

const userSchema = mongoose.Schema({
  username: {type: String, required: [true, "can't be blank"], index: true, unique: true},
  email: {type: String, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true, unique: true},
  hash: String,
  salt: String,
  devices: [deviceSchema]
}, {timestamps: true});



userSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

userSchema.methods.generateJWT = function() {
  var today = new Date();
  var exp = new Date(today);
  //jwt will expire in 1 day
  exp.setDate(today.getDate() + 1);

  return jwt.sign({
    id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, SECRET);
};



userSchema.methods.validPassword = function (password, user){
  return user.hash===crypto.pbkdf2Sync(password, user.salt, 10000, 512, 'sha512').toString('hex')
};



userSchema.methods.toAuthJSON = function(){
  
  return {
    username: this.username,
    email: this.email,
    token: this.generateJWT()
  };
};



userSchema.methods.generateDeviceJWT = function() {
    return jwt.sign({
    id: this._id,
    deviceName: this.deviceName 
  }, SECRET);
};



userSchema.methods.toAuthDeviceJSON = function(){
  this.user.devices.forEach(function(device){
    
    return {
      deviceName: device.deviceName,
      deviceToken: device.deviceToken
    };
  });
};
/*
deviceSchema.methods.generateNewDevice = function (deviceName){
  return { 
    token: this.generateDeviceJWT(),
    deviceName: deviceName
  };
};
*/

userSchema.plugin(uniqueValidator);
const User = mongoose.model('User', userSchema);


module.exports = User;