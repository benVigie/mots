/*
*   The Chat class manage chat component, sending and receving messages between player
*   and server notifications
*/
define(function () {

  var _socket = null,
      _notifyCallback,
      _mesNode = document.getElementById('gsc-messages'),
      _writeNode = document.getElementById('gsc-write');

  function Chat (socket, notifyPlayerListCallback) {
    // Store usefull object and callback
    _socket = socket;
    _notifyCallback = notifyPlayerListCallback

    // On init, bind socket to receive messages
    _socket.on('chat', function (messageObj) {
      treatChatMessage(messageObj);
    });

    // Bind onkeyPress of the textarea node to send messages
    _writeNode.onkeypress = function (event) {

      // If the user press enter, send message
      if (event.keyCode == 13) {
        _socket.emit('chat', _writeNode.value);
        // Then refresh textarea node
        _writeNode.value = '';
        return (false);
      }

    };

  };

  /* Private functions */
  /*
  * On server message receive
  * @param: {Object}  msg   The server message object
  */
  function treatChatMessage(msg) {
    var box = document.createElement('article');

    if (msg.from == 'server') {
      box.classList.add('server-message');
      box.style.color = msg.color;
      box.innerHTML = msg.message;

      // If we received a brand new player list, notify mflEngine
      if (msg.players)
        _notifyCallback(msg.players);
    }
    else {
      box.innerHTML = '<strong style="color: ' + msg.color + ';">' + msg.from + '</strong>' + msg.message;
    }

    // Add message in panel and scroll to the bottom
    _mesNode.appendChild(box);
    _mesNode.scrollTop = _mesNode.scrollHeight;
  }


  /*
  * Print a congrats message in chat !
  * @param {Object}  winner  PLayer object of the winner of the game
  */
  Chat.prototype.congrats = function (winner) {
    var box = document.createElement('article');

    // Create message
    box.innerHTML = 'Partie terminée.<br/>Félicitations à <strong style="color: ' + winner.monster.color + ';">' + winner.nick + '</strong> pour sa victoire !';
    
    // Add message in panel and scroll to the bottom
    _mesNode.appendChild(box);
    _mesNode.scrollTop = _mesNode.scrollHeight;
  };

  return (Chat);

});