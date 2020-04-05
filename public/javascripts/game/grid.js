/*
*   The Grid class manage the displayed game grid and the Cursor
*/
define(['cursor'], function (Cursor) {

  var REVEAL_WORD_ANIM_DELAY  = 50;

  var CaseType = {
    All: 1,
    Letter: 2,
    Description: 3,
    Empty: 4
  };

  var AxisType = {
    Horizontal: 0,
    Vertical:   1
  };

  var _grid,
      _wordValidationCallback,
      _cursor;
  
  function Grid(gridObj, wordValidationCallback) {
    // Save grid object
    _grid = gridObj;

    // Remember word validation callback
    _wordValidationCallback = wordValidationCallback;

    // Instanciate cursor class
    _cursor = new Cursor(gridObj, onNewLetterPrinted);
  }


  function insertDescription(line, column, size, info) {
    var frame = document.createElement('div'),
        lineHeight,
        fontSize,
        descNode;

    // Set class
    frame.className = 'frame description frame' + info.pos;
    // Set size
    frame.style.width = size + 'px';
    frame.style.height = size + 'px';
    // Set position
    frame.style.top = (line * size) + 'px';
    frame.style.left = (column * size) + 'px';

    // Set extra style
    frame.setAttribute('data-line', line);
    frame.setAttribute('data-col', column);
    frame.setAttribute('data-pos', info.pos);

    switch (info.nbLines) {
      case 1:
        lineHeight = size;
        fontSize = Math.floor(lineHeight / 5.4);
        break;

      case 2:
        lineHeight = Math.floor(size / info.nbLines);
        fontSize = Math.floor(lineHeight / 2.6);
        break;

      case 3:
        lineHeight = Math.floor(size / info.nbLines);
        fontSize = Math.floor(lineHeight / 1.8);
        break;
      
      case 4:
        lineHeight = Math.floor(size / info.nbLines);
        fontSize = Math.round(lineHeight / 1.5);
        break;

      default: 
        console.log('[ERROR][grid.js] Don\'t know how to display ' + info.nbLines + ' lines frame !!!');
    }
    
    frame.style.lineHeight = lineHeight + 'px';
    frame.style.fontSize = fontSize + 'px';

    // Adding description in frame
    for (var i = 0; i < info.nbDesc; i++) {
      descNode = document.createElement('span');
      
      // Insert description and arrow
      descNode.innerHTML = info.desc[i];
      descNode.classList.add('arrow' + info.arrow[i].toString());
      
      frame.appendChild(descNode);
    };

    return (frame);
  }

  function insertLetter(line, column, size, info, index) {
    var frame = document.createElement('div');

    // Set class
    frame.className = 'frame letter frame' + info.pos;
    // Set size
    frame.style.width = size + 'px';
    frame.style.height = size + 'px';
    // Set position
    frame.style.top = (line * size) + 'px';
    frame.style.left = (column * size) + 'px';

    // Set extra style
    frame.style.lineHeight = size + 'px';
    frame.style.fontSize = Math.floor(size * 0.6) + 'px';
    frame.setAttribute('data-line', line);
    frame.setAttribute('data-col', column);
    frame.setAttribute('data-pos', info.pos);
    frame.tabIndex = index;

    if (info.dashed)
      frame.classList.add('dash' + info.dashed);

    // Adding extra parameter
    info.available = true;
    info.letter = null;

    return (frame);
  }

  function insertEmptyFrame(line, column, size, info) {
    var frame = document.createElement('div');

    // Set class
    frame.className = 'frame empty frame' + info.pos;
    // Set size
    frame.style.width = size + 'px';
    frame.style.height = size + 'px';
    // Set position
    frame.style.top = (line * size) + 'px';
    frame.style.left = (column * size) + 'px';

    // Set extra style
    frame.setAttribute('data-line', line);
    frame.setAttribute('data-col', column);
    frame.setAttribute('data-pos', info.pos);

    return (frame);
  }

  function getFrameAxisNumber(index, axis) {
    if (axis == AxisType.Horizontal) {
      return (Math.floor(index / _grid.nbColumns));
    }
    else {
      return (index % _grid.nbColumns);
    }
  }

  /*
  *   This function will search an entire word on a specified axis from initialPos.
  *   If the function cannot buil a complete word (letter is missing), return null
  *   @param {Int}  initialPos  The start position in grid
  *   @param {Enum} axis        Axis of the research. Must be AxisType.Horizontal or AxisType.Vertical
  *   @return {Object}  An object representing the word founded or null if we cannot retreive a complete word
  */
  function findWord(initialPos, axis) {
    var word    = _grid.cases[initialPos].letter,
        jump    = (axis == AxisType.Horizontal) ? 1 : _grid.nbColumns, // The axis will define how many frames we have to jump to retreive the next letter
        i       = initialPos - jump,
        wordAxe = getFrameAxisNumber(initialPos, axis),
        firstLetterIndex  = 0;

    // While we have a letter before the current position, continue to compute word
    while ((_grid.cases[i]) && (getFrameAxisNumber(i, axis) == wordAxe) && (_grid.cases[i].type == CaseType.Letter)) {
      // Adding letter and continue
      if (_grid.cases[i].letter != null)
        word = _grid.cases[i].letter + word;
      // Else there is a hole in this word, exit
      else
        return (null);

      // Go to the previous letter
      i -= jump;
    }
    // Save first letter pos
    firstLetterIndex = i + jump;

    // Now finish the word in the other direction
    i = initialPos + jump;
    while ((_grid.cases[i]) && (getFrameAxisNumber(i, axis) == wordAxe) && (_grid.cases[i].type == CaseType.Letter)) {
      // Adding letter and continue
      if (_grid.cases[i].letter != null)
        word += _grid.cases[i].letter;
      // Else there is a hole in this word, exit
      else
        return (null);

      // Go to the next letter
      i += jump;
    }

    // Ignore false detection of 1 letter word 
    if (word.length <= 1)
      return (null);

    // console.log('Mot ' + ((axis == AxisType.Horizontal) ? 'horizontal' : 'vertical') + ' trouvé: [' + word + ']');
    return  ( { 'axis': axis, 'word': word, 'start': firstLetterIndex } );
  }


  /*
  *   Grid callback raise when a new letter is printed on the grid
  *   @param {Int}    pos     Index of the new letter in grid
  *   @param {String} letter  Letter inserted
  */
  function onNewLetterPrinted(pos, letter) {
    var wordObj;

    // Update letter in grid
    _grid.cases[pos].letter = letter;

    // If the letter is valid, check for words
    if (letter != null) {
      // Try to find an horizontaly word
      wordObj = findWord(pos, AxisType.Horizontal);
      if (wordObj != null)
        _wordValidationCallback(wordObj);

      // ... Then a vertical one
      wordObj = findWord(pos, AxisType.Vertical);
      if (wordObj != null)
        _wordValidationCallback(wordObj);
    }
  }

  Grid.prototype.RevealLetters = function (letters) {
    for (const letter of letters) {
      revealCase(letter.pos, letter.value, 'indianred', letter.type, 0);
    }
  };

  /*
  * Function called when a players has found a word. Display it on the grid in the right color
  */
  Grid.prototype.RevealWord = function (wordObj) {
    var index = wordObj.start,
        jump = (wordObj.axis == AxisType.Horizontal) ? 1 : _grid.nbColumns,
        size = wordObj.word.length,
        i,
        node,
        animationDelay = 0;

    for (i = 0; i < size; i++) {
      // If this letter is a just found
      revealCase(index, wordObj.word[i], wordObj.color, wordObj.axis, animationDelay);
      index += jump;
      animationDelay += REVEAL_WORD_ANIM_DELAY;
    }
  };

  function revealCase(index, letter, color, axis, animationDelay) {
    // Update grid object
    _grid.cases[index].letter = letter;
    _grid.cases[index].available = false;

    // Display it
    node = document.querySelector('.frame' + index);
    node.style.cssText += '-webkit-transition-delay: ' + animationDelay + 'ms; transition-delay: ' + animationDelay + 'ms; color: ' + color;
    node.classList.add('reveal' + axis);
    node.innerHTML = _grid.cases[index].letter;
  }


  /*
  * Display the grid on the game screen 
  */
  Grid.prototype.DisplayGrid = function () {
    var container = document.getElementById('gs-grid-container'),
        limit,
        frameSize,
        line, col,
        nbFrames = _grid.cases.length,
        i;

    // First we have to retreive the min size to display the grid
    limit = (container.offsetWidth < container.offsetHeight) ? container.offsetWidth : container.offsetHeight;
    // console.log('Plus petit cote: ' + limit);

    // Determine frame size
    frameSize = (_grid.nbLines > _grid.nbColumns) ? _grid.nbLines : _grid.nbColumns;
    frameSize = Math.floor(limit / frameSize);
    // console.log('Taille de case: ' + frameSize);

    // For each frame
    for (i = 0; i < nbFrames; i++) {
      // Get line and col
      line = Math.floor(i / _grid.nbLines);
      col = i % _grid.nbColumns;

      // Insert frame
      if (_grid.cases[i].type == CaseType.Letter)
        container.appendChild(insertLetter(line, col, frameSize, _grid.cases[i], i));
      else if (_grid.cases[i].type == CaseType.Description)
        container.appendChild(insertDescription(line, col, frameSize, _grid.cases[i]));
      else
        container.appendChild(insertEmptyFrame(line, col, frameSize, _grid.cases[i]));

    };

    // Bind events after a short delay to be sure all new DOM content are injected
    window.setTimeout(function () {
      _cursor.RegisterEvents();
    }, 100);
    
  };

  /*
  * Reset the grid to prepare a new game
  */
  Grid.prototype.resetGrid = function () {
    var container = document.getElementById('gs-grid-container').innerHTML = '';
  };
  

  return (Grid);
  
});
