/**
 * Module dependencies.
 */
var express = require('express'),
    routes  = require('./routes'),
    http  = require('http'),
    path  = require('path'),
    os = require('os'),
    prompts = require('prompts'),
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
    res.json({ SOCKET_ADDR: config.SOCKET_ADDR, SOCKET_PORT: config.SOCKET_PORT });
});

// Start server
http.createServer(app).listen(app.get('port'), onServerReady);

// Retreive command line arguments
if (process.argv[2]) {
  // If the user wants the default grid (debug purpose)
  if ((isNaN(process.argv[2])) && (process.argv[2].toLowerCase() == 'default'))
    _gridNumber = -1;
  // Else if the user try to retreive a special grid
  else if (!isNaN(process.argv[2]))
    _gridNumber = process.argv[2];
}

/** Call when the express server has started */
async function onServerReady() {
  console.log('Express server listening on port ' + app.get('port'));

  var addresses = getLocalIpAddresses();

  if (addresses.length > 1) {
    var response = await prompts({
      type: 'select',
      name: 'value',
      message: 'Choose the IP address to use',
      choices: addresses,
    });

    // Update socket address with the choosen one
    config.SOCKET_ADDR = `http://${addresses[response.value]}`;
  }
  else {
    config.SOCKET_ADDR = `http://${addresses[0]}`;
  }

  console.log(`\n\n\tWaiting for players at ${config.SOCKET_ADDR}:${config.SERVER_PORT}\n\n`);

  // Load desired grid in parameter.
  // -1 to retreive the day grid, 0 for the default one or any number for a special one
  mfl.startMflServer(_gridNumber);
}

/** Get local ip addresses */
function getLocalIpAddresses() {
  var ifaces = os.networkInterfaces();
  var addresses = [];

  Object.keys(ifaces).map(function (ifname) {
    var alias = 0;

    return ifaces[ifname].map(function (iface) {
      if (iface.family !== 'IPv4' || iface.internal !== false) return;
      addresses.push(iface.address);
    });
  });

  return addresses;
}
