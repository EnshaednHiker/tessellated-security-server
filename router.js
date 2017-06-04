require('dotenv').config();
const bodyParser = require('body-parser');

const express = require('express');
const router = express.Router();
router.use(bodyParser.json());

const passport = require('./passport');

const nodemailer = require("nodemailer");

const User = require('./models');
const auth = require('./auth');

//sets up the options for the nodemailer transporter, allowing us to email users alerts
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: `${process.env.USEREMAIL}`,
    pass: `${process.env.PASS}`
  },
  logger: true,
  debug: true
});

//put this in server, placed before pulling in or declaring any routes to all cross origin requests
router.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization');
    res.header('Access-Control-Expose-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });


router.use( (err,req,res,next) => {
  if (err.name === 'ValidationError'){
    return res.status(422).json({
      errors: Object.keys(err.errors).reduce((errors,key) => {
        errors[key] = err.errors[key].message;

        return errors;
      }, {})
    });
  }
  return next(err);
});


/*
request body from form needs to be in this format:

{
  "user": {
    "username": "pudgyBear",
    "email": "jake@example.com".
    "password": "mypasswordisjake"
  }
}
*/

// //endpoint to serve the index.html
// router.get("/", (req,res,next) => {
// });

//endpoint creating new users i.e. registering with the site
router.post('/users', auth.decrypt, (req,res,next) => {
  let user = new User();
  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.setPassword(req.body.user.password);
  user.save()
  .then(() => res.status(201).json({user: user.toAuthJSON()}))
  .catch(err => res.status(500).send(err));
});

//endpoint for logging into a user's profile
router.post('/users/login', auth.decrypt, (req,res,next) => {
    if(!req.body.user.username){
    return res.status(422).json({errors: {username: "can't be blank"}});
  }

  if(!req.body.user.password){
    return res.status(422).json({errors: {password: "can't be blank"}});
  }

  passport.authenticate("local", {session: false},  (err,user,info) => {
    if(err){ return next(err);}
    if(user){
      //authorization token
      user.token = user.generateJWT();
      
      return res.status(201).json({user: user.toAuthJSON()});
    } 
    else {
      return res.status(422).json(info);
    }
  })(req,res,next);
});

//endpoint to get the user's auth payload from their token
router.get('/user/:ID', auth.required, (req,res,next) => {
  User.findById(req.params.ID).then((user)=>{
    if(!user){ return res.sendStatus(401); }

    return res.json({user: user.toAuthJSON()});
  }).catch(next);
});

//endpoint to update user
router.put('/user/:ID', auth.required, (req,res,next)=>{
  User.findById(req.params.ID).then((user)=>{
    if(!user){ return res.sendStatus(401); }
    
    //to only update fields that were passed
    if(typeof req.body.user.username !=="undefined"){
      user.username = req.body.user.username;
    }
    if(typeof req.body.user.email !=="undefined"){
      user.email = req.body.user.email;
    }
    if(typeof req.body.user.password !=="undefined"){
      user.setPassword(req.body.user.password);
    }

    return user.save().then( ()=>res.status(201).json({user: user.toAuthJSON()}))
  }).catch(next);
});

//endpoint to delete a user
router.delete('/user/:ID', auth.required, (req,res,next)=>{
    User.findByIdAndRemove(req.params.ID).then((user)=>{
      if(!user){ return res.sendStatus(401); }

      return user.save().then(()=> {
        return res.status(204).json({user: user.toAuthJSON()});
    });
  })
  .catch(next);
});

//POST endpoint for user to set a tessel device token and tessel device name i.e. "Backdoor" or "Garage door"
router.post('/user/:ID/tessel', auth.required, (req,res,next) =>{
  
  return User.findById(req.params.ID)
    .then((user)=>{
      if(!user){ return res.sendStatus(401); }
      let device = user.devices.create({
          deviceName:req.body.deviceName    
      });
      device["deviceToken"] = user.generateDeviceJWT(req.body.deviceName, device._id);
      user.devices.addToSet(device);
      return user.save().then( () =>{
        return res.status(201).json({user:{devices:user.toAuthDevicesJSON()}});
      });
    })
    .catch(next);
});

//GET endpoint: a user needs to be able to get all of the devices associated with its user account
router.get('/user/:ID/tessel', auth.required, (req,res,next) =>{
  return User.findById(req.params.ID)
    .then((user)=>{
      if(!user){ return res.sendStatus(401); }
      return res.json({devices:user.toAuthDevicesJSON()});
    });
});


//PUT endpoint: a user needs to be able to update a tessel device token and/or name
//this endpoint is currently not used but saved for future development
router.put('/user/:ID/tessel/:tesselID', auth.required, (req,res,next)=>{
  let _user;
  return User.findById(req.params.ID)
    .then((user)=>{
      if(!user){ return res.sendStatus(401); }
      _user = user;
      return user.devices.id(req.params.tesselID);
    })
    .then((device)=>{
      //to only update fields that were passed
      if(!device){ return res.status(404).send("404: device not found"); }
      
      if(req.body.device.deviceName){
        device.deviceName = req.body.device.deviceName;
        device.deviceToken = _user.generateDeviceJWT(req.body.device.deviceName, device._id);
      }
      return _user.save().then( (user) =>{
        return res.status(201).json({device:_user.toAuthDeviceJSON(user.devices.id(device._id))});
      });
    })
    .catch(next);
});

//DELETE endpoint: a user needs to be able to delete a tessel device token/tessel name
router.delete('/user/:ID/tessel/:tesselID', auth.required, (req,res,next)=>{
//create a strong warning for the user so that they know that they will have to go through
//have to through the CLI set up again
  let _user;
  return User.findById(req.params.ID)
    .then((user)=>{
      if(!user){ return res.sendStatus(401); }
      _user = user;
      return user.devices.id(req.params.tesselID);
    })
    .then((device)=>{
      if(!device){ return res.status(404).send("404: device not found"); }
      return _user.devices.id(device._id).remove().then(function(){
        return _user.save() 
          .then( (user) =>{
            return res.status(204).send({device: `Device was removed. ${device.deviceName} no longer exists. Furthermore, the device has been removed`+
            `from the Tessellated Security servers. If you would like to use your tessel with our service in the future, you will have to redo the` + 
            `authorization steps for adding a tessel to your account all over again.`});
          });
      });
    })
    .catch(next);
});


//POST endpoint for the tessel to send requests to to go get emails sent to the user
router.post('/tessel', auth.decrypt, (req,res,next) =>{
  let _user;
  return User.findById(req.body.userId)
    .then((user)=>{
        _user = user;
        return new Promise ((resolve, reject)=>{
          if(!user){ 
              reject(res.sendStatus(401));
               
            }
          else if (user.devices.id(req.body.deviceId)===null){
              reject(res.status(404).send("404: Device not found")); 
          }
          else {
              resolve(user.devices.id(req.body.deviceId));
          }
        })
        .then((device)=>{
          let mailOptions = {
            from: `"Admin" <${process.env.USEREMAIL}>`,
            to: `${_user.username} <${_user.email}>`,
            subject: `Alert: the ${req.body.deviceName} opened!`,
            text: `Alert: the ${req.body.deviceName} opened! Possible intruder!`,
            html: `<h1>Alert from Tessellated Security:</h1> <p>The ${req.body.deviceName} opened! Possible intruder!</p>`,
            dsn:{
              id: `message failure for user: ${_user._id}`,
              return: "headers",
              notify: ["failure","delay"],
              recipient: `Admin <${process.env.USEREMAIL}>`
            }
          };
          let message;
          return new Promise((resolve, reject)=>{
            transporter.sendMail(mailOptions,(error, info)=>{
              if (error){
                reject(error);
              }
              console.log('Message %s sent: %s', info.messageId, info.response);
              resolve(message = `Message ${info.messageId} sent: ${info.response}`); 
            });
          });
        })
        .then((message)=>{
          return res.status(201).json({serverMessage: message});
        })
        .catch(next);
    })
    .catch(next);  
});



module.exports = router;