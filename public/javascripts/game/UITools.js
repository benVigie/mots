/*
*   UITools provide some usefull functions to manage the UI or display informative messages
*/
define(function () {

  var _infPanlTimer = null; // Use for info panel timer reference
      _gameTimer    = null; // Game timer
      _socket       = null; // Socket use to send messages to the server

  function UITools() {
    // Do nothing on init
  }


  function formatTime(ellapsedTime) {
    var m = Math.floor(ellapsedTime / 60),
        s = ellapsedTime % 60,
        str;

    str = (m < 10) ? ('0' + m.toString() + ':') : (m.toString() + ':');
    str += (s < 10) ? ('0' + s.toString()) : s.toString();
    return (str);
  }

  function changeGrid() {
    var texteareaNode = document.getElementById('gsc-write'),
        gridNumber = parseInt(texteareaNode.value);

    // If the grid number retreived is not valid, display an informative tooltip
    if (isNaN(gridNumber))
      new UITools().InfoTooltip(true, 'Pour changer de grille, saisissez <strong>le numéro voulu</strong> dans le chat', 2000);
    // Else send the change grid command
    else {
      _socket.emit('chat', '!grid '+ gridNumber.toString());
      texteareaNode.value = '';
    }
  }


  
  /*
  * Switch game screen to the selected view 
  * @param: {String}  panelName   name of the panel to switch. Node id.
  * @param: {Bool}    isShow      Set if we want show or hide the given panel (true == show)
  */
  UITools.prototype.ChangeGameScreen = function (panelName, isShow) {
    var panel = document.getElementById(panelName),
        currentOverlayPanel = document.querySelector('.ui-displayed');

    if (isShow) {
      if (currentOverlayPanel)
        currentOverlayPanel.classList.remove('ui-displayed');
      panel.classList.add('ui-displayed');
    }
    else {
      if (currentOverlayPanel)
        currentOverlayPanel.classList.remove('ui-displayed');
    }
  };
  
  /*
  * Display the tooltip 
  * @param: {Bool}    isShow    Boolean to show or hide the panel (true == show)
  * @param: {String}  htmlText  Text to display
  * @param: {Int}     timeout   [Optional] Time in millisecond before hide the info panel
  */
  UITools.prototype.InfoTooltip = function (isShow, htmlText, timeout) {
    var topBar   = document.getElementById('info-tooltip'),
        timerFct = this.InfoTooltip;

    // Reset timer if there is one pending
    if (_infPanlTimer != null) {
      window.clearTimeout(_infPanlTimer);
      _infPanlTimer = null;
    }

    // Hide the bar
    if (isShow == false) {
      topBar.classList.remove('showTopBar');
    }
    else {
      // If a set is setted, print it
      if (htmlText)
        topBar.innerHTML = htmlText;
      // If a timeout is specified, close the bar after this time !
      if (timeout)
        _infPanlTimer = setTimeout(function() {
          timerFct(false);
        }, timeout);

      // Don't forget to display the bar :)
      topBar.classList.add('showTopBar');
    }
  };

  /*
  * Build the available monster menu
  * @param {Array}  logoList  List of available monster provided by the server
  */
  UITools.prototype.prepareUserLoginForm = function (logoList) {
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
      // When the user choose a monster, animate the selection
      logosNodes[i].onclick = function (event) {
        var oldSelection = document.querySelector('.myMonster');

        if (oldSelection)
          oldSelection.classList.remove('myMonster');
        
        event.srcElement.classList.add('myMonster');
      }
    };
  };

  /*
  * Display the grid informations (timer, level, etc...) in the empty space of each grid
  * @param {Object}  infos  Grid informations sended by the server
  */
  UITools.prototype.displayGridInformations = function (infos) {
    var timeNode,
        time = 0;

    // First inject the game info panel
    //injectInGameInfoPanel();

    // Retreive time node and inject timer
    timeNode = document.querySelector('#ig-infos > time');
    timeNode.innerHTML = formatTime(time);
    // Refresh timer each seconds
    _gameTimer = window.setInterval(function () {
      timeNode.innerHTML = formatTime(++time);
    }, 1000);

    // Display grid informations
    document.querySelector('#ig-infos > header').innerHTML = infos.provider + ' ' + infos.id + ' - Niveau ' + infos.level;
  };

  /*
  * On game over, call this function to display the end game !
  * @param {Object}  winner  PLayer object of the winner of the game
  */
  UITools.prototype.displayGameOver = function (winner) {
    var gamePanel = document.querySelector('#ig-infos > footer');

    // First stop the timer
    if (_gameTimer != null)
      window.clearInterval(_gameTimer);

    // Set game over class
    document.querySelector('#ig-infos > header').classList.add('game-over');
    
    // Put winner picture
    gamePanel.innerHTML += '<img id="winner-pic" src="' + winner.monster.path + '" alt="winner picture" />';
    window.setTimeout(function() {
      document.getElementById('winner-pic').classList.add('winner-pic-reveal');
    }, 200);
  };

  /*
  * Reset grid information panel to prepare for a new game
  */
  UITools.prototype.resetGridInformations = function () {
    if (_gameTimer != null)
      window.clearInterval(_gameTimer);
  };

  /*
  * Retreive the RGB components of a given color either #123456 or rgb(x,x,x)
  * @param {String}  color  The color as a string
  * @return {String}  The color formated as r,g,b
  */
  UITools.prototype.getRGBComponents = function(color) {
    var bigInt,
        r = 231,  // Default color
        g = 166,  // Default color
        b = 26;   // Default color

    // If the color provided by the browser is in hex format (#123456)
    if (color[0] == '#') {
      bigInt = parseInt(color.substr(1), 16)
      r = (bigInt >> 16) & 255;
      g = (bigInt >> 8) & 255;
      b = bigInt & 255;
    }
    // If the color is already in rgb format
    else if (color[0] == 'r')
      return (color.substr(4).split(')')[0]);

    return (r + ',' + g + ',' + b);
  };

  /*
  * Bind server command buttons.
  * @param {Object}   socket  The color as a string
  */
  UITools.prototype.bindServerCommandButtons = function(socket) {
    _socket = socket;

    document.getElementById('gsc-command-start').addEventListener('click', function () { _socket.emit('chat', '!start'); }, false);
    document.getElementById('gsc-command-grid').addEventListener('click', changeGrid, false);;
  };


  return (UITools);
  
});