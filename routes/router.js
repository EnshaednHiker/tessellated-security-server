const bodyParser = require('body-parser');

const express = require('express');
const router = express.Router();
router.use(bodyParser.json());

const passport = require('../config/passport');



const User = require('../models/user');
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

//endpoint creating new users i.e. registering with the site
router.post('/users', (req,res,next) => {
  let user = new User();

  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.setPassword(req.body.user.password);

  user.save().then( () => { 
    return res.json({user: user.toAuthJSON()});
  }).catch(next);
});

//endpoint for logging into a user's profile
router.post('/users/login', (req,res,next) => {
    if(!req.body.user.username){
    return res.status(422).json({errors: {username: "can't be blank"}});
  }

  if(!req.body.user.password){
    return res.status(422).json({errors: {password: "can't be blank"}});
  }

  passport.authenticate("local", {session: false}, (err,user,info) => {
    if(err){ return next(err);}
    console.log("passport", info);
    if(user){
      user.token = user.generateJWT();
      return res.json({user: user.toAuthJSON()});
    } 
    else {
      return res.status(422).json(info);
    }
  })(req,res,next);
});

//endpoint to get the user's auth payload from their token
router.get('/user', auth.required, (req,res,next) => {
  User.findById(req.payload.id).then((user)=>{
    if(!user){ return res.sendStatus(401); }

    return res.json({user: user.toAuthJSON()});
  }).catch(next);
});

//endpoint to update user
router.put('/user', auth.required, (req,res,next)=>{
  User.findById(req.payload.id).then((user)=>{
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

    return user.save().then(()=> {
      return res.json({user: user.toAuthJSON()});
    });
  }).catch(next);
});

//endpoint to delete a user
//to ask Ken about this next session, need to make sure this works properly
router.delete('/user', auth.required, (req,res,next)=>{
    User.findByIdAndRemove(req.payload.id).then((user)=>{
    if(!user){ return res.sendStatus(401); }

    return user.save().then(()=> {
      return res.json({user: user.toAuthJSON()});
    });
  })
  .exec()
  .then(user => res.status(204).end())
  .catch(next);
});


//try to get tessel to talk to server with a get
//viable NPM packages according to Ken: request, request-promise, superagent
//tessel will need ip of my pc plus port since server is locally hosted
router.get('/tessel', (req,res,next) =>{
  res.send("The tessel touched the face of God!")
});

/*
router.get('/login', (req, res) => {
   console.log(req.query);
    Blog
        .find(req.query || {})
        .exec()
        .then(Blogs => res.json(
            Blogs.map(blog => blog.apiRepr())
        ))
        .catch(err => {
            console.error(err);
            res.status(500).json({message: 'Internal server error'})
        });
});

router.get('/login', (req, res) => {
    User
    .find(req.body.username && req.body.password)
    .exec()
    .then(ts =>res.json(ts.apiRepr()))
    .catch(err => {
      console.error(err);
        res.status(500).json({message: 'Internal server error'})
    });
});

router.post('/register', (req, res) => {

  const requiredFields = ["username",  "password", "emailAddress"];
  
  requiredFields.forEach(field => {
    
    if (!(field in req.body)) {
      const message = `Missing ${field} in request body, you dummy!`
      console.error(message);
      return res.status(400).send(message);
    }
  });

  tessellatedSecurity
    .create({
      username: req.body.username,
      password: req.body.password,
      emailAddress: req.body.emailAddress
    })
    .then(ts => res.status(201).json(ts.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    })
  });



router.put('/:id', (req, res) => {
  
  if (!(req.params.id && req.body.id && req.body.id === req.params.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`);
    console.error(message);
    res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateableFields = ['title', 'content', 'author'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Blog
    // all key/value pairs in toUpdate will be updated -- that's what `$set` does
    .findByIdAndUpdate(req.params.id, {$set: toUpdate})
    .exec()
    .then(blog => res.status(201).json(blog.apiRepr()))
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

router.delete('/:id', (req, res) => {
  Blog
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(blog => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

router.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});

*/

module.exports = router;