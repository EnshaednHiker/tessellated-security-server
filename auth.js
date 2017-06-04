const token = require('jsonwebtoken');
const jwt = require('express-jwt');
const {SECRET} = require('./config');

function getTokenFromHeader(req){
  
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
}

function decryptToken(vanillaToken){
  return token.verify(vanillaToken,SECRET);
}

function decrypt (req,res,next){
   try{
    req.body = token.verify(req.body.payload, SECRET);
    next();
   }catch(err){
    res.status(500).send(`Error decrypting token: ${err}`);
   }
 };

  function encrypt (data){
   try{
    return token.sign(data, SECRET); 
   }catch(err){
    console.log(err);
   }
   
};

const auth = {
  required: jwt({
    secret: SECRET,
    
    getToken: getTokenFromHeader
  }),
  optional: jwt({
    secret: SECRET,
    userProperty: 'payload',
    credentialsRequired: false,
    getToken: getTokenFromHeader
  }),
  decrypt: decrypt,
  encrypt: encrypt,
  jwt: token,
  secret: SECRET,
  decryptToken: decryptToken  
};

module.exports = auth;
