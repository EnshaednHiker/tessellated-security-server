const chai = require('chai');
const chaiHttp = require('chai-http');

const mongoose = require('mongoose');

const should = chai.should();
const expect = chai.expect;

const {app} = require('../server');

chai.use(chaiHttp);

  describe('GET endpoint', function() {

    it('getting the index.html should return a 200 response', function() {
      let res;
      return chai.request("http://localhost:8080")
        .get('/')
        .end(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          done();
        });
    });
  });