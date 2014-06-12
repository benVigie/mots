/**
 * Module dependencies.
 */
var express = require('express'),
    routes  = require('./routes'),
    http  = require('http'),
    path  = require('path'),
    app   = express(),
    config  = require('./conf.json'), 
    mfl   = require('./game_files/motsFleches'),

    _gridNumber = 0;


// all environments
app.set('port', config.SERVER_PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/conf.json', function(req, res) {
    res.sendfile('conf.json');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// Retreive command line arguments
if (process.argv[2]) {
  // If the user wants the default grid (debug purpose)
  if ((isNaN(process.argv[2])) && (process.argv[2].toLowerCase() == 'default'))
    _gridNumber = -1;
  // Else if the user try to retreive a special grid
  else if (!isNaN(process.argv[2]))
    _gridNumber = process.argv[2];
}

// Start server with desired grid in parameter. 
// -1 to retreive the day grid, 0 for the default one or any number for a special one
mfl.startMflServer(_gridNumber);