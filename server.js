// var conf = require('./config')

var app = require('./app');

var port = 5002;

var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});
