var util          = require('util'),
    EventEmitter  = require('events').EventEmitter,
    Player        = require('./player'),
    enums         = require('./enums'),
    Monsters      = require('./playersLogos').Monsters;

var _playersList      = []
    _currentPlayerId  = 0;


function PlayersManager () {
  EventEmitter.call(this);
}

util.inherits(PlayersManager, EventEmitter);

PlayersManager.prototype.addNewPlayer = function (playerSocket) {
  var newPlayer;

  // Create new player and add it in the list
  newPlayer = new Player(playerSocket, _currentPlayerId++);
  _playersList.push(newPlayer);

  console.info('New player connected. There is currently ' + _playersList.length + ' player(s)');

  return (newPlayer);
};

PlayersManager.prototype.removePlayer = function (player) {
  var pos = _playersList.indexOf(player);

  if (pos < 0) {
    console.error("[ERROR] Can't find player in playerList");
  }
  else {
    console.info('Removing player ' + player.getNick());
    _playersList.splice(pos, 1);
    console.info('It remains ' + _playersList.length + ' player(s)');
  }
};

PlayersManager.prototype.getPlayerList = function () {
  var players = [],
      nbPlayers = _playersList.length,
      i;

  for (i = 0; i < nbPlayers; i++) {
    players.push(_playersList[i].getPlayerObject());
  };

  return (players);
};

PlayersManager.prototype.getNumberOfPlayers = function () {
  return (_playersList.length);
}

PlayersManager.prototype.getAvailableMonsters = function () {
  var availableMonsters = [],
      i,
      nbLogos = Monsters.length;

  for (i = 0; i < nbLogos; i++) {
    if (Monsters[i].player == null)
      availableMonsters.push(Monsters[i]);
  };

  return (availableMonsters);
};

PlayersManager.prototype.setMonsterToPlayer = function (player, monsterId) {
  if ((monsterId > (Monsters.length - 1)) || (Monsters[monsterId].player != null)) {
    console.error('[ERROR] Monster ' + monsterId + ' seems to be unavailable');
    
    // Set the first available monster to this user
    monsterId = 0;
    while (Monsters[monsterId].player != null)
      monsterId++;
  }

  // Set monster to this player
  player.setMonster(Monsters[monsterId]);
  Monsters[monsterId].player = player.getID();
};

PlayersManager.prototype.getWinner = function () {
  var i,
      bestScore = 0,
      winnerIndex;

  // Look in all players which one has the bigger score
  for (i in _playersList) {
    if (_playersList[i].getScore() > bestScore) {
      bestScore = _playersList[i].getScore();
      winnerIndex = i;
    }
  };

  // Return the high score player
  return (_playersList[winnerIndex]);
};

PlayersManager.prototype.resetPlayersForNewGame = function () {
  var index;

  for (index in _playersList) {
    _playersList[index].resetPlayerInfos();
  };
};


module.exports = PlayersManager;
