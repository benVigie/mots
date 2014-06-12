/*
*   UITools provide some usefull functions to manage the UI or display informative messages
*/
define(function () {

  var _infPanlTimer = null; // Use for info panel timer reference
      _gameTimer    = null; // Game timer

  function UITools() {
    // Do nothing on init
  }


  function injectInGameInfoPanel() {
    var emptyNodes = document.querySelectorAll('.empty'),
        square = {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        };

    // Find an available space within empty spaces (fuck the ads !!!)
    if (emptyNodes) {
      square.x = emptyNodes[0].offsetLeft;
      square.y = emptyNodes[0].offsetTop;
      square.width = emptyNodes[emptyNodes.length - 1].offsetLeft + emptyNodes[emptyNodes.length - 1].offsetWidth - square.x;
      square.height = emptyNodes[emptyNodes.length - 1].offsetTop + emptyNodes[emptyNodes.length - 1].offsetHeight - square.y;

      // Now put the info panel on the grid
      document.getElementById('gs-grid-container').innerHTML += '<div id="ig-infos" style="left: ' + square.x + 'px; top: ' + square.y + 'px; width: ' + square.width + 'px; height: ' + square.height + 'px;"><header></header><time></time><footer></footer></div>';
    }
  }

  function formatTime(ellapsedTime) {
    var m = Math.floor(ellapsedTime / 60),
        s = ellapsedTime % 60,
        str;

    str = (m < 10) ? ('0' + m.toString() + ':') : (m.toString() + ':');
    str += (s < 10) ? ('0' + s.toString()) : s.toString();
    return (str);
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
  * @param: {Int}     timeout   Time in millisecond before hide the info panel
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
    injectInGameInfoPanel();

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

    console.log(winner);
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

  return (UITools);
  
});