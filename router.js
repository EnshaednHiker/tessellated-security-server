const bodyParser = require('body-parser');

const express = require('express');
const router = express.Router();
router.use(bodyParser.json());

const passport = require('./passport');



const User = require('./models');
const auth = require('./auth');



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

//endpoint to serve the index.html
// router.get("/", (req,res,next) => {

// });


//endpoint creating new users i.e. registering with the site
router.post('/users', (req,res,next) => {
  let user = new User();
  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.setPassword(req.body.user.password);
  user
  .save()
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


//try to get tessel to talk to server with a get
//viable NPM packages according to Ken: request, request-promise, superagent


//POST endpoint for user to set a tessel device token and tessel device name i.e. "Backdoor" or "Garage door"
router.post('/user/:ID/tessel', auth.required, (req,res,next) =>{
  
   return User.findById(req.params.ID)
  .then((user)=>{
    if(!user){ return res.sendStatus(401); }
    user.devices.push({
        deviceName:req.body.user.devices.deviceName,
        deviceToken: user.generateDeviceJWT(req.body.user.devices.deviceName)
    });
    
    return user.save().then( () =>{
      return res.status(201).json({user:{devices:user.toAuthDeviceJSON()}});
    });
  })
  .catch(next);
});

//PUT endpoint: a user needs to be able to update a tessel device token and/or name







//POST endpoint for the tessel to send requests to go get emails sent to the user
//req to server at this endpoint in this format:
//req.body.payload
router.post('/tessel/', auth.decrypt, (req,res,next) =>{
  
  User.findById(req.body.userId).then((user)=>{
    if(!user){ return res.sendStatus(401); }
    //might want to encrypt video data to send over on the tessel's end


  });
  res.sendStatus(200).send("The tessel touched the face of God!");
});

module.exports = router;