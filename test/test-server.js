const chai = require('chai');
const chaiHttp = require('chai-http');
const auth = require('../auth');

const mongoose = require('mongoose');
const User = require('../models')

const should = chai.should();
const expect = chai.expect;

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
        .send({user: User})
  });
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

  describe('GET endpoint', function() {

    it('getting the index.html should return a 200 response', function() {
      let res;
      return chai.request(app)
        .get('/')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          //done();
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
          /*user.validPassword(dummyUser.password, 
            User.
              findOne({username:dummyUser.username})
              .exec()
            ).should.equal.to.true;*/
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
          .then(function(res){
           //should assertions testing that an already registered user cannot make an account
           //console.log("duplicative user post endpoint",res.body);
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
        //how do I want to handle this? decide how I want it to be generic
        .then(function(res){
          //this is an authentication token that gets created after we've successfully logged in
          authenticatedToken = res.body.user.token;
          console.log("login response: ", res.body);
          res.body.user.email.should.equal("tesseluser40@gmail.com");
          res.body.user.token.should.be.a('string');
          res.body.user.username.should.equal(user.user.username);
          console.log("decrypted token: ", auth.jwt.verify(res.body.user.token, auth.secret));
          //make more assertions, confirm username, email, and token are all being sent
          //decrypt the token and see what's in there, any good assertions to be made there?
        })
    });
    it('GET endpoint: a user needs to get the user\'s auth payload from their token', function(){

    });
    it("PUT endpoint: a user needs to be able to update one's username, email, or password", function(){

    });

    it("POST endpoint: a user needs to be able to set a tessel device token and tessel device name", function(){

    });
    it("PUT endpoint: a user needs to be able to update a tessel device token and/or name", function(){

    });
    it("DELETE endpoint: a user needs to be able to delete a tessel device token/tessel name", function(){

    });
    it("POST endpoint: a user's tessel needs to be able to send req alerts through the user's email address",function(){

    });
    it("DELETE endpoint: a user needs to be able to delete a user account", function(){
      let user = auth.jwt.verify(authenticatedToken, auth.secret);
      console.log("delete endpoint", user);
      
      return chai.request(app).delete(`/user/${user.id}`)
        .set("Authorization", `Bearer ${authenticatedToken}`)
        .then(function(res){
          res.should.have.status(204);
          return User.findById(user.id).exec();        
        })
        .then(function(_user){
          should.not.exist(_user);
        })
    });
  });

});