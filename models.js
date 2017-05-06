const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const {SECRET} = require('./config');

//Device schema requires that the device name be unique and is required, is a child of the user schema
const deviceSchema = mongoose.Schema({
  deviceName: {type: String, required: [true, "can't be blank"], unique: true},
  deviceToken: String
}, {timestamps: true});

//User schema is requires that usernames and emails are unique and required
const userSchema = mongoose.Schema({
  username: {type: String, required: [true, "can't be blank"], index: true, unique: true},
  email: {type: String, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true, unique: true},
  hash: String,
  salt: String,
  devices: [deviceSchema]
}, {timestamps: true});

//Encrypts password via crypto before seeding into the database
userSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

//Generates the token for a when a user logs in, creates, updates, or deletes a user
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

//Generates JSON to be sent to client when user info is created or updated or deleted
userSchema.methods.toAuthJSON = function(){
  
  return {
    username: this.username,
    email: this.email,
    token: this.generateJWT()
  };
};

//Check when the user's password encrypts to the same hash when the same parameters are use, if true its the same password
userSchema.methods.validPassword = function (password, user){
  return user.hash===crypto.pbkdf2Sync(password, user.salt, 10000, 512, 'sha512').toString('hex')
};

//Child schemas do not get their own instance methods, have to assign them to the parent
//Generates a token for a device without an expiration date
userSchema.methods.generateDeviceJWT = function(deviceName) {
    return jwt.sign({
    userId: this._id,
    deviceName: deviceName
  }, SECRET);
};

//Child schemas do not get their own instance methods, have to assign them to the parent
//JSON to be sent to the client after a new device created or updated or deleted
userSchema.methods.toAuthDevicesJSON = function(){

  return this.devices.map(function(device){
    return {
      deviceName: device.deviceName,
      deviceToken: device.deviceToken,
      deviceId: device._id
    };
  },this);
};

userSchema.methods.toAuthDeviceJSON = function(){
    return {
      deviceName: device.deviceName,
      deviceToken: device.deviceToken,
      deviceId: device._id
    };
};

//the unique validator plugin has to be added prior to assigning the schema to the const User, fyi
userSchema.plugin(uniqueValidator);

//As of Mongoose v4.9.7, child schemas don't get assigned to their own model
const User = mongoose.model('User', userSchema);

module.exports = User;