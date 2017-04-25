
const express = require('express');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const morgan = require('morgan');

const test;


const app = express();

app.use(express.static('public'));



app.listen(process.env.PORT || 8080);

module.exports = {app};