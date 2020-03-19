/*
*   Game Engine
*/
require(['../lib/text!../../conf.json', 'UITools', 'grid', 'chat', 'score'], function (Conf, UITools, GridManager, Chat, Score) {

  var enumState = {
    Login: 0,
    Waiting: 1,
    OnGame: 2
  };

  var enumPanels = {
    Login: 'login-panel',
    Game: 'game-panel',
    Error: 'error-panel'
  };

  var _gameState = enumState.Login,
      _gridManager,
      _scoreManager,
      _ui,
      _chat,
      _socket,
      _grid;

  Conf = JSON.parse(Conf);


  function startClient () {
    if (typeof io == 'undefined') {
      document.getElementById('ep-text').innerHTML = 'Cannot retreive socket.io file at the address ' + Conf.SOCKET_ADDR + '<br/><br/>Please provide a valid address.';
      _ui.ChangeGameScreen(enumPanels.Error, true);
      console.log('Cannot reach socket.io file !');
      return;
    }

    // Instanciate usefull classes
    _ui = new UITools();
    _scoreManager = new Score();

    // document.getElementById('gs-loader-text').innerHTML = 'Connecting to the server...';
    _socket = io.connect(location.protocol + "//" + location.hostname, { reconnect: false });
    _socket.on('connect', function() {
      
      console.log('Connection established :)');
      
      // Bind server disconnect event
      _socket.on('disconnect', function (reason) {
        if (reason && reason == 'booted')
          document.getElementById('ep-text').innerHTML = 'Désolé, la partie a déjà commencée !';
        else
          document.getElementById('ep-text').innerHTML = 'Connection au serveur perdue';
        _ui.ChangeGameScreen(enumPanels.Error, true);
        console.log('Connection with the server lost :( ');
      });

      // Bind login event
      _socket.on('logos', function (availableLogos) {
        if (_gameState == enumState.Login) {
          if (availableLogos == null) {
            document.getElementById('lp-infos').innerHTML = '';
            _ui.InfoTooltip(true, "<strong>Ho non, c'est balot !</strong><br/>Il semblerait qu'il n'y ai plus de place pour le jeu en cours.");
          }
          else
            prepareUserLoginForm(availableLogos);
        }
      });
      
      // Display login screen and bind start button
      _ui.ChangeGameScreen(enumPanels.Login, true);
      document.getElementById('lp-start-btn').onclick = sendPlayerReady;

    });

    _socket.on('error', function() {
      document.querySelector('body').innerHTML += 'Fail to connect the WebSocket to the server.<br/><br/>Please check the WS address.';
      _ui.ChangeGameScreen(enumPanels.Error, true);
      console.log('Cannot connect the web_socket');
    });
    
  }

  function prepareUserLoginForm(logoList) {
    var logosNodes = '',
        i,
        nbLogos = logoList.length;

    // Insert all available monster logo in login form
    for (i = 0; i < nbLogos; i++) {
      if (logosNodes.player == null)
        logosNodes += '<img class="lp-logos-monster" src="' + logoList[i].path + '" style="border-color: ' + logoList[i].color + '" data-monster-id="' + logoList[i].id + '">';
    };
    document.getElementById('lp-logos').innerHTML = logosNodes;

    // Bind select event
    logosNodes = document.querySelectorAll('.lp-logos-monster');
    nbLogos = logosNodes.length;
    for (i = 0; i < nbLogos; i++) {
      logosNodes[i].onclick = function (event) {
        var oldSelection = document.querySelector('.myMonster');

        // Unset last selection if any and set the new monster
        if (oldSelection)
          oldSelection.classList.remove('myMonster');
        event.srcElement.classList.add('myMonster');

        // Show the color !
        document.getElementById('lp-nick').style.borderColor = event.srcElement.style.borderColor;
      }
    };
  }

  function sendPlayerReady () {
    var nick = document.getElementById('lp-nick').value,
        monsterNode = document.querySelector('.myMonster'),
        monster;

    // If nick is empty or if it has the default value, 
    if ((nick == '') || (monsterNode == null)) {
      _ui.InfoTooltip(true, 'Vous devez choisir un <strong>pseudo</strong> et un <strong> petit monstre</strong> !', 4000);
      return (false);
    }
    
    monster = parseInt(monsterNode.getAttribute('data-monster-id'), 10);

    // Unbind button event to prevent "space click"
    document.getElementById('lp-start-btn').onclick = function() { return false; };

    // Connect chat
    _chat = new Chat(_socket, _scoreManager.UpdatePlayerList);

    // Bind grid event, meaning the game is about to start !
    _socket.on('grid_event', onStartGame);
    // Bind also grid reset, to play more than one game :p
    _socket.on('grid_reset', resetGame);

    // Send player infos to the server
    _socket.emit('userIsReady', { 'nick': nick, 'monster': monster } );
    
    // Bind score update
    _socket.on('score_update', _scoreManager.RefreshScore);
  
    // Finally bind game over event
    _socket.on('game_over', function (winner) {
      _ui.displayGameOver(winner);
      _chat.congrats(winner);
    });

    // Show game screen and change state
    _ui.ChangeGameScreen(enumPanels.Game, true);
    _gameState = enumState.Waiting;

    // Bind command buttons
    _ui.bindServerCommandButtons(_socket);

    // Set player's color
    setPlayerColor(monsterNode.style.borderColor);

    return (false);
  }

  function onStartGame(gridEvent) {
    var startTimer;

    // Instanciate grid manager and provide the validation callback
    _gridManager = new GridManager(gridEvent.grid, function (wordObj) {
      _socket.emit('wordValidation', wordObj);
    });

    // Display timer before game start
    if (gridEvent.timer > 0) {
      _ui.InfoTooltip(true, '<strong>Tenez-vous prêt !</strong><br/>Début des hostilités dans <strong>' + (gridEvent.timer--) + '</strong>');
      startTimer = window.setInterval(function () {
        _ui.InfoTooltip(true, '<strong>Tenez-vous prêt !</strong><br/>Début des hostilités dans <strong>' + (gridEvent.timer--) + '</strong>');
        
        // When the timer is over
        if (gridEvent.timer < 0) {
          // Clear timer
          window.clearInterval(startTimer);

          // Display grid !!
          _gridManager.DisplayGrid();
          _ui.displayGridInformations(gridEvent.grid.infos);

          // Remove tooltip
          _ui.InfoTooltip(false, 'Bonne chance !');
        }
      }, 1000);
    }
    else {
      _gridManager.DisplayGrid();
      _ui.displayGridInformations(gridEvent.grid.infos);
    }

    // Bind get word event
    _socket.on('word_founded', _gridManager.RevealWord);
  }

  function resetGame() {
    _ui.resetGridInformations();
    _scoreManager.resetScores();
    if (_gridManager)
      _gridManager.resetGrid();
  }

  function setPlayerColor(color) {
    var color = _ui.getRGBComponents(color),
        css = '.focusCell { -moz-box-shadow: inset 0px 0px 30px 4px rgba(' + color + ',0.2);box-shadow: inset 0px 0px 30px 4px rgba(' + color + ',0.2);border-color: rgba(' + color + ',0.4); } .goRight:before, .goDown:before { color: rgb(' + color + '); }',
        style = document.createElement('style');

    style.type = 'text/css';
    
    if (style.styleSheet)
      style.styleSheet.cssText = css;
    else
      style.appendChild(document.createTextNode(css));

    document.head.appendChild(style);
  }


  // Load ressources and Start the client !
  console.log('Client started');
  startClient();
  
});