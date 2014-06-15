var enums           = require('./enums'),
    config          = require('../conf.json'),
    GridManager     = require('./gridManager'),
    PlayersManager  = require('./playersManager');

// Defines
var MAX_PLAYERS   = 4;
var SERVER_CHAT_COLOR = '#c0392b';
var TIME_BEFORE_START = 3;

// Parameters
var _playersManager,
    _gridManager,
    _io,
    _gameState,
    _lastWordFoudTimestamp;

function startGame() {
  var Grid = _gridManager.getGrid();

  // Change game state
  _gameState = enums.ServerState.OnGame;

  // Send grid to clients
  _io.sockets.emit('grid_event', { grid: Grid, timer: TIME_BEFORE_START } );
}

function playerLog (socket, nick, monsterId) {
  // Retreive PlayerInstance
  socket.get('PlayerInstance', function (error, player) {

    if (error)
      console.error(error);
    else {

      // Set new player parameters
      player.setNick(nick);
      _playersManager.setMonsterToPlayer(player, monsterId);
      // Refresh monster list for unready players
      _io.sockets.emit('logos', _playersManager.getAvailableMonsters());

      // Bind found word event
      socket.on('wordValidation', function (wordObj) {
        checkWord(player, wordObj);
      });

      // Notify everyone about the new client
      sendChatMessage( nick + ' a rejoint la partie !<br/>' + _playersManager.getNumberOfPlayers() + ' joueurs connectés', undefined, undefined, _playersManager.getPlayerList());
    }
  });
}

function bonusChecker(playerPoints, nbWordsRemaining) {
  var bonus = {
    points: 0,
    bonusList: []
  },
  now = new Date().getTime();

  // If it's the first word, add 4 bonus points
  if (_lastWordFoudTimestamp == null) {
    bonus.bonusList.push( { title: "Preum's !", points: 4 } );
    bonus.points += 4;
  }

  // If it's the last word
  if (nbWordsRemaining <= 0) {
    bonus.bonusList.push( { title: 'Finish him !', points: 4 } );
    bonus.points += 4;
  }

  // If it's the first word since the last 2 minutes, 5 points
  if ((now - _lastWordFoudTimestamp) > 120000) {
    bonus.bonusList.push( { title: 'Débloqueur', points: 5 } );
    bonus.points += 5;
  }

  // If it's a big word, add 3 points
  if (playerPoints >= 6) {
    bonus.bonusList.push( { title: 'Gros mot !', points: 3 } );
    bonus.points += 3;
  }

  return (bonus);
}

function checkWord(player, wordObj) {
  var points,
      bonuses;

  // Check word
  points = _gridManager.checkPlayerWord(wordObj);

  // If the players has some points, it's mean it's the right word ! Notify players about it
  if (points > 0) {

    // Notify all clients about this word
    wordObj.color = player.getColor();
    _io.sockets.emit('word_founded', wordObj );

    // Check for bonuses
    bonuses = bonusChecker(points, _gridManager.getGrid().nbWords);

    // Remember time this last word had been found
    _lastWordFoudTimestamp = new Date().getTime();

    // Update player score and notify clients
    player.updateScore(points + bonuses.points);
    _io.sockets.emit('score_update', { playerID: player.getID(), score: player.getScore(), words: player.getNbWords(), progress: _gridManager.getAccomplishmentRate(player.getScore()), bonus: bonuses.bonusList } );

    if (_gridManager.getGrid().nbWords <= 0)
      _io.sockets.emit('game_over', _playersManager.getWinner().getPlayerObject());
  }
}


function sendChatMessage(Message, sender, color, playerList) {
  if (sender === undefined) {
    sender = 'server';
    color = SERVER_CHAT_COLOR;
  }

  _io.sockets.emit('chat', { message: Message, from: sender, color: color, players: playerList } );
}


/**
 *  Start mfl server.
 */
exports.startMflServer = function (desiredGrid) {
  // Instanciiate io module with proper parameters
  _io = require('socket.io').listen(config.SOCKET_PORT);
  _io.configure(function(){
    _io.set('log level', 2);
  });

  // Retreive the grid
  _gridManager = new GridManager();
  _gridManager.retreiveAndParseGrid(desiredGrid, function (grid) {
    if (grid == null) {
      // If an error occurs, exit
      console.error('[ERROR] Cannot retreive grid. Abord server.');
      process.exit(1);
    }
  });

  // Create playersManager instance and register events
  _playersManager = new PlayersManager();
  _playersManager.on('players-ready', function () {
});


  // On new client connection
  _io.sockets.on('connection', function (socket) {

    // If it remains slots in the room, add player and bind events
    if ((_gameState == enums.ServerState.WaitingForPlayers) && (_playersManager.getNumberOfPlayers() < MAX_PLAYERS)) {
      
      // Add new player
      var player = _playersManager.addNewPlayer(socket);
      
      // Register to socket events
      socket.on('disconnect', function () {
        // When a player disconnect, retreive player instance
        socket.get('PlayerInstance', function (error, player) {
          sendChatMessage( player.getNick() + ' a quitté la partie');
          _playersManager.removePlayer(player);
          player = null;
        });

      });

      socket.on('userIsReady', function (infos) {
        // Log player, bind events and notify everyone
        if (_gameState == enums.ServerState.WaitingForPlayers)
          playerLog(socket, infos.nick, infos.monster);
        else // Notify game has started
          socket.disconnect('game_already_started');
      });

      socket.on('chat', function (message) {
        // If it's a message for the server, treat it
        if (message == '!start')
          startGame();
        // Else broadcast the message to everyone
        else {
          socket.get('PlayerInstance', function (error, player) {
            sendChatMessage(message, player.getNick(), player.getColor());
          });
        }
      });

      // Remember PlayerInstance and push it to the player list
      socket.set('PlayerInstance', player);

      // Send to the player availables logos
      socket.emit('logos', _playersManager.getAvailableMonsters());
    }
    // Else notify players he can't play for the moment
    else {
      // To do it, returns an empty list of available logos == null
      socket.emit('logos', null);
    }

  });
  

  // Set game state and print ready message
  _gameState = enums.ServerState.WaitingForPlayers;
  console.log('Game started and waiting for players on port ' + config.SOCKET_PORT);
};
