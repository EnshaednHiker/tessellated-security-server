const chai = require('chai');
const chaiHttp = require('chai-http');


const mongoose = require('mongoose');

const should = chai.should();
const expect = chai.expect;

const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config/config');
chai.use(chaiHttp);

describe('Tessellated Security API', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
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
});