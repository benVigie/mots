var http    = require('http'),
    config  = require('../conf.json').GRID_PROVIDER,
    enums   = require('./enums'),
    Case    = require('./case'),
    Extend  = require('util')._extend;

var _grid           = null, // the grid itself !
    _wordsPoints    = null,
    _theme          = null,
    _gridInfos      = null,
    _nbLetters      = 0,
    _lastSearchCase = 0;

var enumCaseParser = {
  InARow: 1,
  Horizontal: 2,
  Vertical: 3
};

var enumArrow = {
  Right: 0,
  RightBottom: 1,
  Bottom: 2,
  BottomRight: 3
};


function GridManager() {
  // Init grid infos
  _gridInfos = {
    provider: '',
    id:       0,
    level:    0,
    nbWords:  0
  };
}

function getNextCase(grid, kindMove, caseType, lastCase) {
  var iterator = 0;

  // Get the last case position
  if (lastCase) {
    iterator = lastCase.pos;
  
    // Move iterator to the next case according the kind of search we want
    if ((kindMove == enumCaseParser.InARow) || (kindMove == enumCaseParser.Horizontal))
      iterator++;
    else if (kindMove == enumCaseParser.Vertical)
      iterator += grid.nbLines;
  }

  // Don't bypass array length !
  if (iterator >= grid.cases.length)
    return (null);

  // According to the kind of case we want, continue searching or not
  if (caseType != grid.cases[iterator].type)
    return (getNextCase(grid, kindMove, caseType, grid.cases[iterator]));

  return (grid.cases[iterator]);
}

function insertDescription(grid, desc) {
  var currentCase = getNextCase(grid, enumCaseParser.InARow, enums.CaseType.Description),
      assigned = false;

  // Try to set description then go to the next available description case
  // If the desc has been set, or if we run out of cases, exit the loop
  while (currentCase !== null && !assigned) {
    assigned = currentCase.setDescription(desc);
    currentCase = getNextCase(grid, enumCaseParser.InARow, enums.CaseType.Description, currentCase);
  }
}

function isALetterCase(Char) {
  if ((Char >= 'A') && (Char <= 'Z'))
    return (true);

  return (false);
}

function getCaseType(Char) {
  if (Char == 'z')
    return (enums.CaseType.Empty);
  else if ((Char >= 'A') && (Char <= 'Z'))
    return (enums.CaseType.Letter);
  else
    return (enums.CaseType.Description);
}

function onGetGridError(cb, errorMessage) {
  // Print error reason
  console.error('\t[ERROR]: Cannot retreive grid...');
  console.error('\t[ERROR]: ' + errorMessage);

  // Raise callback with null parameter
  cb(null);
}

function parseGrid(callback, serverText) {
  var stArray,
      info,
      i, j,
      length,
      line,
      currentCase = 0,
      type,
      grid = {
        nbLines: 0,
        nbColumns: 0,
        nbWords: 0,
        cases: []
      };

  stArray = serverText.split('&');

  length = stArray.length;
  for (i = 0; i < length; i++) {
    
    info = stArray[i].split('=');

    // Insert new line in grid
    if (info[0].indexOf('lign') > -1) {

      for (j in info[1]) {
        type = getCaseType(info[1][j]);

        if (type == enums.CaseType.Letter) {
          grid.cases.push(new Case.LetterCase(currentCase++, info[1][j]));
          _nbLetters++;
        }
        else if (type == enums.CaseType.Description)
          grid.cases.push(new Case.DescriptionCase(currentCase++, info[1][j]));
        else
          grid.cases.push(new Case.EmptyCase(currentCase++));
      };

      // Update col & line counters
      if (grid.nbLines == 0)
        grid.nbLines = info[1].length;
      grid.nbColumns++;
    }
    else if (info[0].indexOf('tx') > -1) {
      insertDescription(grid, info[1]);
    }
    else if (info[0].indexOf('pointille') > -1) {
      grid.cases[(parseInt(info[0].substr(9), 10)) - 1].dashed = info[1];
    }
    else {
      switch (info[0]) {
        case 'nomjeu':
        case 'coul':
        case 'nbphotos':
        case 'casephotos':
        case 'fin':
        case '?':
        case '':
          // Ignore useless tags
          break;

        case 'niveau':
          _wordsPoints = info[1];
          grid.nbWords = _wordsPoints.length;
          _gridInfos.nbWords = _wordsPoints.length;
          break;

        case 'themecase':
          _theme = info[1];
          break;

        case 'legende':
          _gridInfos.level = parseInt(info[1][info[1].length - 1], 10);
          break;
        
        default:
          console.info('\t[GRIDMANAGER] Unknow grid tag [' + info[0] + ']');
      }
    }
  };

  // Place arrows
  placeArrows(grid);

  _grid = grid;
}

function placeArrows(grid) {
  var i,
      gridSize = grid.cases.length;

  // Check each cell to find a description frame
  for (i = 0; i < gridSize; i++) {
    if (grid.cases[i].type == enums.CaseType.Description) {
      
      // According the type of description, set the right arrow to the 
      switch (grid.cases[i].value) {
        case 'a':
          grid.cases[i].arrow[0] = enumArrow.Right;
          break;
        case 'b':
          grid.cases[i].arrow[0] = enumArrow.Bottom;
          break;
        case 'c':
          grid.cases[i].arrow[0] = enumArrow.RightBottom;
          break;
        case 'd':
          grid.cases[i].arrow[0] = enumArrow.BottomRight;
          break;

        case 'f':
        case 'g':
        case 'h':
          grid.cases[i].arrow[0] = enumArrow.Right;
          grid.cases[i].arrow[1] = enumArrow.Bottom;
          break;
        case 'k':
        case 'l':
        case 'm':
          grid.cases[i].arrow[0] = enumArrow.RightBottom;
          grid.cases[i].arrow[1] = enumArrow.Bottom;
          break;
        case 'p':
        case 'q':
        case 'r':
          grid.cases[i].arrow[0] = enumArrow.Right;
          grid.cases[i].arrow[1] = enumArrow.BottomRight;
          break;
        case 'v':
        case 'w':
          grid.cases[i].arrow[0] = enumArrow.RightBottom;
          grid.cases[i].arrow[1] = enumArrow.BottomRight;
          break;

        default:
          console.error('[ERROR][gridManager::placeArrows] Unknow arrow type [' + grid.cases[i].value + '] at frame ' + i);
      }

    }
  };
}

function getGridAddress(commandArgv) {
  var gridNumber,
      today,
      gridDefaultDay,
      dayDiff;

  switch (commandArgv) {
    // No number given, load day grid
    case 0:
      console.info('\n\t[GRIDMANAGER] Load day grid');
      // Compare the default date with today. Add this difference to the default grid number
      gridDefaultDay = new Date(config.PROVIDER_DEFAULT_GRID_DATE);
      today = new Date();
      dayDiff = Math.abs(today.getTime() - gridDefaultDay.getTime());
      dayDiff = Math.floor(dayDiff / (1000 * 3600 * 24));
      gridNumber = config.PROVIDER_DEFAULT_GRID + dayDiff;
      break;
    
    // Retreive the default grid
    case -1:
      console.info('\n\t[GRIDMANAGER] Load default grid');
      gridNumber = config.PROVIDER_DEFAULT_GRID;
      break;

    // Load the specified grid
    default:
      console.info('\n\t[GRIDMANAGER] Load specific grid');
      gridNumber = commandArgv;
      break;
  }

  // Set provider name
  _gridInfos.provider = config.PROVIDER_NAME;
  _gridInfos.id = gridNumber;

  // Return the grid address
  return (config.PROVIDER_ADDR + gridNumber.toString() + config.PROVIDER_EXTENSION);
}

/* PUBLIC METHODS */

/*
* Check if the player's founded word is the right one
* @param  {Object}  wordObj   Client word object
* @return {Int}    Points scored by the player. If return 0, it's just the wrong word :)
*/
GridManager.prototype.checkPlayerWord = function (wordObj) {
  var jump      = (wordObj.axis == 0) ? 1 : _grid.nbColumns,
      wordSize  = wordObj.word.length,
      points    = 0,
      index     = wordObj.start,
      i;

  // Check each letters
  for (i = 0; i < wordSize; i++) {
    // If the letter doesn't match the grid, return false
    if (wordObj.word[i] != _grid.cases[index].value)
      return (0);
    
    if (_grid.cases[index].available == true)
      points++;

    index += jump;
  };

  // It'es the righ word, so set letters as already founded
  index = wordObj.start;
  for (i = 0; i < wordSize; i++) {
    if (_grid.cases[index].available == true)
      _grid.cases[index].available = false;
    index += jump;
  };

  // Decrease word counter
  _grid.nbWords--;

  return (points);
}

GridManager.prototype.getGrid = function () {
  var clonedGrid,
      index;

  // Clone the grid object by extanded an empty object
  // clonedGrid = Extend({}, _grid);
  clonedGrid = JSON.parse(JSON.stringify(_grid));

  // Adding grid's informations
  clonedGrid.infos = _gridInfos;

  // Finally hide letters before send it to the players :)
  for (index in clonedGrid.cases) {
    if (clonedGrid.cases[index].type == enums.CaseType.Letter)
      clonedGrid.cases[index].value = '';
  };

  return (clonedGrid);
}

GridManager.prototype.getAccomplishmentRate = function (playerPoints) {
  return (Math.floor(playerPoints / _nbLetters * 100));
}

GridManager.prototype.retreiveAndParseGrid = function (gridNumber, callback) {
  var gridAddr = getGridAddress(gridNumber),
      req = http.get(gridAddr, function (res) {
    
    var bodyChunks = [];

    console.info('\n\t[GRIDMANAGER] Try to load ' + gridAddr);
    
    if (res.statusCode !== 200) {
      onGetGridError(callback, 'Wrong statusCode ' + res.statusCode);
    }
    else {
      // Read server response
      res.on('data', function (chunk) {
        // Buffer the body...
        bodyChunks.push(chunk);
      }).on('end', function() {

        console.info('\t[GRIDMANAGER] Grid downloaded, start parsing...\n');

        // Parse server response to extract a grid object
        parseGrid(callback, Buffer.concat(bodyChunks).toString());
        
        console.info('\n\t[GRIDMANAGER] Parsing Done. Now play ' + _gridInfos.provider + ' ' +  _gridInfos.id + ' - Level ' +  _gridInfos.level);
      });

    }

  });

  req.on('error', function (e) {
    // Notify error
    onGetGridError(callback, e.message);
  });

  return (true);
}

module.exports = GridManager;