const bodyParser = require('body-parser');

const express = require('express');
const router = express.Router();
router.use(bodyParser.json());





const passport = require('../config/passport');


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