
const express = require('express');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const morgan = require('morgan');

require('./models/User');
require('./config/passport');

const app = express();

app.use(express.static('public'));


const {PORT, DATABASE_URL} = require('./config/config');

//const {router} = require('./routes/router');

app.use(morgan('common'));

app.use(require('./routes/router'));

let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}


function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};

















