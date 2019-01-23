var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var mongoose = require('mongoose');
var cors = require("cors");
var webController = require('./controllers/web/mainController');

app.use(cors());
app.use(bodyParser.json());


//--------------database connection----------------------------------------------//
mongoose.connect('mongodb://abhinav:talent99@ds161104.mlab.com:61104/talent_naksha');
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", function() {
    console.log('Database Connected');
});

app.use('/',webController);
module.exports = app;
