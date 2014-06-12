var MySQL = require('mysql');

var DB_HOST = '127.0.0.1';
var DB_USER = 'root';
var DB_PASS = ''
var DB_DATA = 'birds'

var NUMBER_OF_HIGHSCORES_TO_RETREIVE = 10;

var isDbAvailable = false;

/*
* This class will store the best score of all players.
* It will try to reach a DB by default (best way to store datas). But if you don't have a MySQL server or if the class
* can't establish a connection, player's score will be store in an array (but values will be lost on server shutdown !)
* 
*/
function ScoreSystem () {
  var testConnection;

  // Default array
  this._bestScore = [];

  testConnection = MySQL.createConnection({
    host     : DB_HOST,
    user     : DB_USER,
    password : DB_PASS,
    database : DB_DATA
  });

  // Test if DB is available
  testConnection.connect(function (err) {
    if (err) {
      console.info("\n\t[ScoreSystem] Can't connect user [" + DB_USER + '] to database hosted in [' + DB_HOST + ']');
      console.info("\t[ScoreSystem] Players score will be store in an array, and loose when server will be off\n");
      isDbAvailable = false;
    }
    else {
      console.info("\n\t[ScoreSystem] Database available and connected !\n");
      isDbAvailable = true;
  
      // Close connection after test
      testConnection.end();
    }
  });
};

function openConnection() {
  // Create connection
  var connection = MySQL.createConnection({
    host     : DB_HOST,
    user     : DB_USER,
    password : DB_PASS,
    database : DB_DATA
  });

  // Connection to DB
  connection.connect(function (err) {
    if (err) {
      console.error("\n\t[MYSQL ERROR] Can't connect user [" + DB_USER + '] to database hosted in [' + DB_HOST + ']');
    }
  });

  return (connection);
}

ScoreSystem.prototype.setPlayerHighScore = function (player) {
  var nick = player.getNick(),
      connection;

  // If DB is available, try to get the highscore of the player.
  // If there is no score, insert this player in DB
  if (isDbAvailable === true) {

    // Connect to DB and escape user entry by precaution
    connection = openConnection();
    nick = connection.escape(nick);

    // Get the player highscore
    connection.query("SELECT `hs_score` AS `HS` FROM `highscores` WHERE `hs_player` = " + nick + ";", function (err, rows, fields) {
      
      if (rows.length == 0) {
        // If no score had been found for this player, it's his first game. Store him in DB
        console.info("\n\t[ScoreSystem] Unknow player " + nick + '. Insert him in DB :) !');
        
        connection.query("INSERT INTO `highscores` (`hs_id`, `hs_player`, `hs_score`) VALUES (NULL, " + nick + ", '0');", function (err, rows, fields) {
          
          // Set player HS
          if (rows.affectedRows == 1) {
            player.setBestScore(0);
          }
          else {
            console.error('\n\t[MYSQL ERROR] Fail to insert player ' + nick + ' in DB');
          }
        });
      }
      else {
        // Set player HS
        player.setBestScore(parseInt(rows[0].HS, 10));
      }
      // Close connection
      connection.end();
    });

  }
  else {
    if (typeof this._bestScore[nick] != 'undefined')
      player.setBestScore(this._bestScore[nick]);
    else
      player.setBestScore(0);  
  }
};

ScoreSystem.prototype.savePlayerScore = function (player, lastScore) {
  var nick = player.getNick(),
      highScore = player.getHighScore(),
      connection;

  // If the player just beats his highscore, record it !
  if (lastScore > highScore) {
    if (isDbAvailable === true) {

      // Open connection to DB
      connection = openConnection();
      nick = connection.escape(nick);
      
      // Store the last score
      connection.query("UPDATE `highscores` SET `hs_score` = '" + lastScore + "' WHERE `highscores`.`hs_player` = " + nick + ";", function (err, rows, fields) {
        if (rows.affectedRows != 1) {
          console.error('\n\t[MYSQL ERROR] Fail to update ' + nick + ' high score in DB');
        }
        console.info(nick + ' new high score (' + lastScore + ') was saved in DB !');

        // Close connection
        connection.end();
      });
    }
    else {
      this._bestScore[nick] = lastScore;
      console.info(nick + ' new high score (' + lastScore + ') was saved in the score array !');
    }
  }
};

ScoreSystem.prototype.getHighScores = function (callback) {
  var connection,
      hsArray = null,
      nbRes,
      i, key;

  // If DB is available, request it highscores
  if (isDbAvailable === true) {

    // Open connection to DB
    connection = openConnection();
    
    // get the 10 best scores
    connection.query("SELECT * FROM `highscores` ORDER BY `highscores`.`hs_score` DESC LIMIT 0, " + NUMBER_OF_HIGHSCORES_TO_RETREIVE, function (err, rows, fields) {
      if (rows.affectedRows <= 0) {
        console.error('\n\t[MYSQL ERROR] Cannot retreive highscore in DB');
      }
      else {
        nbRes = rows.length;
        hsArray = [];
        
        for (i = 0; i < nbRes; i++) {
          hsArray.push( { player: rows[i].hs_player, score: rows[i].hs_score } );
        };

        callback(hsArray);
      }
      
      // Close connection
      connection.end();
    });
  }
  else {
    // Sort tab 
    this._bestScore.sort(function (a, b) {
      if (a > b)
        return (-1);
      if (a < b)
        return (1);
      return (0);
    });

    // Return the NUMBER_OF_HIGHSCORES_TO_RETREIVE best scores
    hsArray = [];
    nbRes = (this._bestScore.length > NUMBER_OF_HIGHSCORES_TO_RETREIVE) ? NUMBER_OF_HIGHSCORES_TO_RETREIVE : this._bestScore.length;

    for (key in this._bestScore) {
      hsArray.push( { player: key, score: this._bestScore[key] } );
    };
  }

  callback(hsArray);
};

module.exports = ScoreSystem;