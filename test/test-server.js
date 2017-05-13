const chai = require('chai');
const chaiHttp = require('chai-http');
const auth = require('../auth');

const mongoose = require('mongoose');
const User = require('../models')

const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;

const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');
chai.use(chaiHttp);







// generate an object representing a user.
// can be used to generate seed data for db
// or request.body data
function seedUserData() {
  console.info('seeding User data');
  const dummyUsers = [
    {
      username: 'user40',
      email: "tesseluser40@gmail.com",
      password: "abcd1234"
    },
    {
      username: 'bigdaddy',
      email: "tesselpapatessel@gmail.com",
      password: "efgh5678"
    },
    {
      username: 'thetesselation',
      email: "tesselthetesselation@gmail.com",
      password: "ijkl9101112"
    }
  ]
  dummyUsers.forEach(function(User){
      return chai.request(app)
        .post('/users')
        .set("Content-Type", "application/json")
        .send({user:User})
        .then((res) => console.info("seeded user: ", res.body.user.username));
  });
  //return User.insertMany(dummyUsers);
}


// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure data from one test does not stick
// around for next one
function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}






describe('Tessellated Security API', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  before(function() {
    return seedUserData();
  });

  after(function() {
    return tearDownDb();
  });

  after(function() {
     return closeServer();
  })

  describe('Serving Static Files', function() {

    it('GET endpoint: a user should be able to visit the index.html', function() {
      return chai.request(app)
        .get('/')
        .then(function(res) {
          expect(res).to.have.status(200);
        })
    });
  });
  describe('Users', function(){
    const dummyUser = {username: "scooby", email: "greatEmail@aol.com", password: "1234"};
    let authenticatedToken;
    
    it('POST endpoint: a new user should be able to create an account', function(){
      
      
      return chai.request(app)
        .post('/users')
        .set("Content-Type", "application/json")
        .send({user: dummyUser})
        .then(function(res){
          //console.log(res.body);
          res.should.have.status(201);
          //res.body.should.be.json;
          res.body.should.be.a('object');
          res.body.user.username.should.equal(dummyUser.username);
          res.body.user.email.should.equal(dummyUser.email);
    
          return User.findOne({username:dummyUser.username})
        })
        .then(function(_user){
          expect(_user.validPassword(dummyUser.password,_user)).to.be.true;
        })
        .catch(function(err){
          console.log(err);
        })
    });
    it('POST endpoint: an already registered user should NOT be able create an account under the same username', function(){
       let duplicativeUser = 
       { 
        username: 'user40',
        email: "tesseluser40@gmail.com",
        password: "abcd1234"
      };

        return chai.request(app)
          .post('/users')
          .set("Content-Type", "application/json")
          .send({user:duplicativeUser})
          .catch(function(err){
           //should assertions testing that an already registered user cannot make an account
           err.should.have.status(500);
          })
       
        
    });
    it('POST endpoint: a user should be able to log in', function(){
      //find user
      let user =  {
        user: {
          username: 'user40',
          password: "abcd1234"
        }
      }
      //this is the token that encrypts the credentials sent from client to server over the wire
      let tokenPayload = auth.encrypt(user);
      return chai.request(app)
        .post('/users/login')
        .set("Content-Type", "application/json")
        .send({payload:tokenPayload})
        .then(function(res){
          //this is an authentication token that gets created after we've successfully logged in, will be reused in protected endpoint tests for testing when a user is logged in
          authenticatedToken = res.body.user.token;
          //make more assertions, confirm username, email, and token are all being sent
          res.body.user.email.should.equal("tesseluser40@gmail.com");
          res.body.user.token.should.be.a('string');
          res.body.user.username.should.equal(user.user.username);
          //decrypt the token and see what's in there, any good assertions to be made there?
          decryptedResponseToken = auth.jwt.verify(res.body.user.token, auth.secret);
          //.exp is when the token expires while .iat is when the token was created, exp should be larger (come after) than iat
          expect(decryptedResponseToken.exp).to.be.above(decryptedResponseToken.iat);
        })
    });
    it('GET endpoint: a user needs to get the user\'s auth payload from their token', function(){
      //this is the token that encrypts the credentials sent from client to server over the wire
      let user = auth.jwt.verify(authenticatedToken, auth.secret);
      //chai request to to get user's auth


    });
    it("PUT endpoint: a user needs to be able to update one's username, email, or password to new credentials", function(){
      
      let userNewCredentials =  {
          username: 'user40new',
          password: "abcd1234new",
          email: "tesseluser40new@gmail.com"
        }

      //this is the token that encrypts the credentials sent from client to server over the wire
      let user = auth.jwt.verify(authenticatedToken, auth.secret);
      //chai request to initially change the user's credentials to new ones
      return chai.request(app)
        .put(`/user/${user.id}`)
        .set("Authorization", `Bearer ${authenticatedToken}`)
        .send({user:userNewCredentials})
        .then(function(res){
          res.should.have.status(201);
          return User.findById(user.id).exec();
        })
        .then(function(_user){
          //make more assertions, confirm username, email, and token are all being sent
          _user.email.should.equal(userNewCredentials.email);
          _user.username.should.equal(userNewCredentials.username);
          expect(_user.validPassword(userNewCredentials.password, _user)).to.be.true;
        });
    });
it("PUT endpoint: a user needs to be able to update one's username, email, or password to old credentials", function(){
      let userOldCredentials = {
          username: 'user40',
          password: "abcd1234",
          email: "tesseluser40@gmail.com"
        }
      //this is the token that encrypts the credentials sent from client to server over the wire
      let user = auth.jwt.verify(authenticatedToken, auth.secret);

        //chai request to finally change the the user's credentials back to the old ones
        return chai.request(app)
          .put(`/user/${user.id}`)
          .set("Authorization", `Bearer ${authenticatedToken}`)
          .send({user:userOldCredentials})
          .then(function(res){
            res.should.have.status(201);
            return User.findById(user.id).exec();
          })
          .then(function(_user){
            //make more assertions, confirm username, email, and token are all being sent
            _user.email.should.equal(userOldCredentials.email);
            _user.username.should.equal(userOldCredentials.username);
            expect(_user.validPassword(userOldCredentials.password, _user)).to.be.true;
          }); 
    });

    it("POST endpoint: a user needs to be able to set a tessel device token and tessel device name", function(){
      //this is the token that encrypts the credentials sent from client to server over the wire
      let user = auth.jwt.verify(authenticatedToken, auth.secret);
        //chai request to post the user's choice of deviceName and get back a token
        return chai.request(app)
          .post(`/user/${user.id}/tessel`)
          .set("Authorization", `Bearer ${authenticatedToken}`)
          .send({user:{devices:{deviceName: "Garage door tessel"}}})
          .then(function(res){
            res.should.have.status(201);
            return User.findById(user.id);
          })
          .then(function(_user){
            let created = _user.devices.filter(function(device){
              return device.deviceName === "Garage door tessel";
            });
            created.length.should.be.at.least(1);
            created[0].deviceName.should.be.a("string");
            created[0].deviceToken.should.be.a("string");
            //all tokens start with the "e" character
            expect(created[0].deviceToken.charAt(0)).to.equal('e');
          });
    });
    it("GET endpoint: a user needs to be able to get all of the devices associated with its user account", function(){
      //this is the token that encrypts the credentials sent from client to server over the wire
      let user = auth.jwt.verify(authenticatedToken, auth.secret);
        
        return chai.request(app)
          .get(`/user/${user.id}/tessel`)
          .set("Authorization", `Bearer ${authenticatedToken}`)
          .then(function(res){
            res.should.have.status(200);
            expect(res.body).to.be.an("object");
            expect(res.body.devices.length).to.be.above(0);
            expect(res.body.devices[0].deviceName).to.equal("Garage door tessel")
            res.body.devices[0].deviceToken.should.be.a("string");
            //all tokens start with the "e" character
            expect(res.body.devices[0].deviceToken.charAt(0)).to.equal('e');
          })

    });
    it("PUT endpoint: a user needs to be able to update a tessel device token and/or name", function(){
      //this is the token that encrypts the credentials sent from client to server over the wire
      let user = auth.jwt.verify(authenticatedToken, auth.secret);
      return User.findById(user.id)
        .then(function(_user){
          return _user;
        })
        .then(function(_user){
          let device = _user.devices[0]
          //chai request to post the user's choice of deviceName and get back a token
          return chai.request(app)
            .put(`/user/${user.id}/tessel/${device._id}`)
            .set("Authorization", `Bearer ${authenticatedToken}`)
            .send({device:{deviceName: "Front door tessel"}})
            .then(function(res){
              res.should.have.status(201);
              return _user.devices.id(device._id);
            })
            .then(function(_device){
              expect(_device.deviceName).to.equal(device.deviceName)
              _device.deviceToken.should.be.a("string");
              //all tokens start with the "e" character
              expect(_device.deviceToken.charAt(0)).to.equal('e');
            });
        });
    });

    it("POST endpoint: a user's tessel needs to be able to send req alerts through the user's email address",function(){
     /* let tesselToken;
      let user = auth.jwt.verify(authenticatedToken, auth.secret);
        return User.findById(user.id)
          .then(function(_user){
            return _user;
          })
          .then(function(_user){
            tesselToken = _user.devices[0].deviceToken 
            return chai.request(app)
              .post(`/tessel/`)
              .set("Authorization", `Bearer ${tesselToken}`)
              .then(function(res){
                res.should.have.status(201);
              })
          }); */
    });
    it("DELETE endpoint: a user needs to be able to delete a tessel device token/tessel name", function(){
      //this is the token that encrypts the credentials sent from client to server over the wire
      let user = auth.jwt.verify(authenticatedToken, auth.secret);
      return User.findById(user.id)
        .then(function(_user){
          return _user;
        })
        .then(function(_user){
          let device = _user.devices[0]
          //chai request to post the user's choice of deviceName and get back a token
          return chai.request(app)
            .delete(`/user/${user.id}/tessel/${device._id}`)
            .set("Authorization", `Bearer ${authenticatedToken}`)
            .then(function(res){
              res.should.have.status(204);
              return User.findById(user.id).then(function(user){
                user.devices.length.should.equal(0); 
              });
            });
        });
    });
    it("DELETE endpoint: a user needs to be able to delete a user account", function(){
      let user = auth.jwt.verify(authenticatedToken, auth.secret);
      return chai.request(app)
        .delete(`/user/${user.id}`)
        .set("Authorization", `Bearer ${authenticatedToken}`)
        .then(function(res){
          res.should.have.status(204);
          return User.findById(user.id).exec();        
        })
        .then(function(_user){
          should.not.exist(_user);
        });
    });
  });
});


