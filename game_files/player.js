var enums   = require('./enums');

function Player (socket, uid) {
  this._socket    = socket;
  this._playerTinyObject = {
      id:         uid,
      nick:       '',
      monster:    null,
      score:      0,
      nbWords:    0
    };
  };

  Player.prototype.getNick = function () { return (this._playerTinyObject.nick); };
  Player.prototype.setNick = function (nick) {
    this._playerTinyObject.nick = nick;
    console.info('Please call me [' + nick + '] !');
  };
  Player.prototype.setMonster = function (monster) {
    this._playerTinyObject.monster = monster;
    console.info(this._playerTinyObject.nick + ' uses [' + monster.id + ']');
  };

  Player.prototype.getID = function () { return (this._playerTinyObject.id); };
  Player.prototype.getScore = function () { return (this._playerTinyObject.score); };
  Player.prototype.getNbWords = function () { return (this._playerTinyObject.nbWords); };
  Player.prototype.getColor = function () { return (this._playerTinyObject.monster.color); };
  Player.prototype.getPlayerObject = function () { return (this._playerTinyObject); };
  
  Player.prototype.setReadyState = function (readyState) {
    this._playerTinyObject.state = (readyState == true) ? enums.PlayerState.Playing : enums.PlayerState.WaitingInLobby;
    console.info(this._playerTinyObject.nick + ' is ' + ((this._playerTinyObject.state == enums.PlayerState.Playing) ? 'ready !' : 'not yet ready'));
  };

  Player.prototype.isReadyToPlay = function () {
    if (this._playerTinyObject.state == enums.PlayerState.Playing)
      return (true);
    return (false);
  };

  Player.prototype.updateScore = function (points) {
    this._playerTinyObject.score += points;
    this._playerTinyObject.nbWords++;
  };

module.exports = Player;