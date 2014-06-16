/*
*   The Score class manage the score panel. It has to maintain the player list and refresh score during the game
*/
define(function () {

  // Defines
  var SCORE_BAR_PERCENT_WIDTH   = 21;
  var DELAY_BETWEEN_BONUSES     = 200;


  /*
  *   Constructor
  */
  function Score () {
    
  };

  /* Private functions */
  

  /* Public functions */
  
  /*
  * On new player list received
  * @param: {Array}  playerList   Array of players
  */
  Score.prototype.UpdatePlayerList = function(playerList) {
    var i,
        nbPlayers = playerList.length,
        scoreNode = document.getElementById('gs-scores');

    // Reset old player score div
    scoreNode.innerHTML = '';

    for (i = 0; i < nbPlayers; i++) {
      if (playerList[i].monster)
        scoreNode.innerHTML += '<article id="player' + playerList[i].id + '" class="playerScore bloc' + nbPlayers + '"><div class="score-bar" style="background-color: ' + playerList[i].monster.color + '"><img src="' + playerList[i].monster.path + '"></div><footer><h3>' + playerList[i].nick + '</h3><strong>' + playerList[i].score + ' points</strong><span>' + playerList[i].nbWords + ' mots</span></footer></article>';
    }
  };

  /*
  * When a player scores, we have to refresh his infos ! 
  * @param: {Array}  playerList   Array of players
  */
  Score.prototype.RefreshScore = function(scoreObj) {
    var scoreNode = document.getElementById('player' + scoreObj.playerID),
        bonusNode,
        animationDelay = 0,
        nbBonuses,
        i;

    // Update player progress bar
    document.querySelector('#player' + scoreObj.playerID + ' > div').style.height = scoreObj.progress + '%';

    // Update score and nb words
    document.querySelector('#player' + scoreObj.playerID + ' > footer > strong').innerHTML = scoreObj.score + ' points';
    document.querySelector('#player' + scoreObj.playerID + ' > footer > span').innerHTML = scoreObj.words + ' mots';

    // For each bonus to display, if any
    for (i = 0, nbBonuses = scoreObj.bonus.length; i < nbBonuses; i++) {
      // Create bonus text node
      bonusNode = document.createElement('span');
      bonusNode.className = 'bonus';
      // Adding delay before apparition for multiple bonuses
      bonusNode.style.cssText = '-webkit-animation-delay: ' + animationDelay + 'ms; -moz-animation-delay: ' + animationDelay + 'ms; animation-delay: ' + animationDelay + 'ms;';
      bonusNode.innerHTML = scoreObj.bonus[i].title + '<br/>+ ' + scoreObj.bonus[i].points + ' pts';
      
      // Add event listener on animation end to properly remove the node
      bonusNode.addEventListener('animationend', function (event) {
        // Remove node when animation ends
        scoreNode.removeChild(event.srcElement);
      }, false);
      bonusNode.addEventListener('webkitAnimationEnd', function (event) {
        // Remove node when animation ends
        scoreNode.removeChild(event.srcElement);  
      }, false);

      // Adding bonus in DOM and increase delay before the next bonus
      scoreNode.appendChild(bonusNode);
      animationDelay += DELAY_BETWEEN_BONUSES;
    };

  };

  /*
  * Reset player's score to prepare for a ne game
  * @param: {Array}  playerList   Array of players
  */
  Score.prototype.resetScores = function() {
    var scoreNodes = document.querySelectorAll('.playerScore'),
        size,
        i;

    for (i = 0, size = scoreNodes.length; i < size; i++) {
      // Reset score bar
      scoreNodes[i].querySelector('div').style.height = '0%';

      // Update score and nb words
      scoreNodes[i].querySelector('footer > strong').innerHTML = '0 points';
      scoreNodes[i].querySelector('footer > span').innerHTML = '0 mots';
    }

  };


  return (Score);

});