/*
*   The cursor is used to focus a special frame and write in it
*/
define(function () {

  var enumDirections = {
    Left: 37,
    Up: 38,
    Right: 39,
    Down: 40
  };

  var _grid,
      _letterUpdateCallback,
      _nbLines,
      _nbCols,
      _focusCell = null;
      _focusDirection = null;
  
  /*
  *   Constructor
  *   @param: {Object}    gridObj               Grid instance given by the server
  *   @param: {Function}  letterUpdateCallback  Function to call when we update a letter frame (insert new letter or delete current one)
  */
  function Cursor(gridObj, letterUpdateCallback) {
    // Getting Grid
    _grid = gridObj.cases;
    _nbLines = gridObj.nbLines;
    _nbCols = gridObj.nbColumns

    // Retreive callback
    _letterUpdateCallback = letterUpdateCallback;
  }


  /*-------------------------
      
      Private functions
  
  -------------------------*/

  /*
  *   Set the cursor direction
  *   @param: {Int}  direction   [Optional] If this parameter is setted, force the direction. Else just toggle the current direction
  */
  function setCursorDirection(direction) {
    // If no direction given, toggle current direction
    if (!direction) {
      if (_focusDirection == enumDirections.Right) {
        _focusCell.classList.remove('goRight');
        _focusCell.classList.add('goDown');
        _focusDirection = enumDirections.Down;
      }
      else {
        _focusCell.classList.remove('goDown');
        _focusCell.classList.add('goRight');
        _focusDirection = enumDirections.Right;
      }
    }
    // Else change direction to the one needed then apply right style
    else {
      _focusDirection = (_focusDirection == enumDirections.Right) ? enumDirections.Down : enumDirections.Right;
      _focusCell.classList.remove('goRight');
      _focusCell.classList.remove('goDown');
      if (_focusDirection == enumDirections.Right)
        _focusCell.classList.add('goRight');
      else
        _focusCell.classList.add('goDown');
    }
  }

  /*
  *   Move the cursor to the next case according to the direction
  *   @param: {Int}  direction   [Optional] If this parameter is setted, force the direction. Else just follow the cursor one.
  *   @return: {Bool}  True if the cursor has moved, else false
  */
  function moveCursor(direction) {
    var frameNumber = parseInt(_focusCell.getAttribute('data-pos')),
        index = 0;

    // Retreive direction if not specified
    if (direction == undefined)
      direction = _focusDirection;

    // According to the direction, check if the next frame is available
    switch (direction) {
      case enumDirections.Left:
        // The first frame will always be a description frame
        index = frameNumber - 1;
        break;
      case enumDirections.Right:
        index = ((frameNumber + 1) >= _grid.length) ? 0 : (frameNumber + 1);
        break;
      case enumDirections.Up:
        index = (frameNumber > _nbCols) ? (frameNumber - _nbCols) : 0;
        break;
      case enumDirections.Down:
        index = ((frameNumber + _nbCols) >= _grid.length) ? 0 : (frameNumber + _nbCols);
        break;

      default:
        console.log('[ERROR] [Cursor.moveCursor] Unknow direction ' + direction);
    }

    // If the next frame is a letter frame, movo on it
    if (_grid[index].type == 2) {
      // Release old frame
      _focusCell.classList.remove('goRight');
      _focusCell.classList.remove('goDown');
      _focusCell.classList.remove('focusCell');

      // Focus new frame
      _focusCell = document.querySelector('.frame' + index);
      _focusCell.classList.add('focusCell');
      if (direction == enumDirections.Left || direction == enumDirections.Right) {
        _focusDirection = enumDirections.Right;
        _focusCell.classList.add('goRight');
      }
      else {
        _focusDirection = enumDirections.Down;
        _focusCell.classList.add('goDown');
      }

      return (true);
    }
    // Else do nothing
    else
      return (false);
  }


  function onClickReceived(event) {
    if (_focusCell != null) {
      // If the player clicked the same frame, just toggle the cursor direction
      if (_focusCell == event.target) {
        setCursorDirection();
        return;
      }
      _focusCell.classList.remove('goRight');
      _focusCell.classList.remove('goDown');
      _focusCell.classList.remove('focusCell');
    }

    // Remember the cell, focus it and set default direction
    _focusCell = event.target;
    _focusCell.classList.add('focusCell');
    _focusCell.classList.add('goRight');
    _focusDirection = enumDirections.Right;
  }

  /*
  * When a letter is pressed on the grid
  */
  function onLetterPressed(event) {
    var key = event.keyCode;

    // If a letter is pressed
    if ((key >= 65) && (key <= 90)) {
      insertLetter(key);
    }

    // If backspace or escape is pressed
    if ((key == 8) || (key == 27)) {
      removeLetter();
      event.preventDefault();
    }

    // If an arrow is pressed
    if ((key >= 37) && (key <= 40))
      moveCursor(key);

  }


  /*
  * Insert a letter in the grid
  */
  function insertLetter(letter) {
    var character = String.fromCharCode(letter),
        pos = parseInt(_focusCell.getAttribute('data-pos'));

    // Print letter on grid if we can
    if ((_focusCell != null) && (_grid[pos].available == true)) {
      _focusCell.innerHTML = character;
    
      // Notify grid that a new letter is inserted
      _letterUpdateCallback(pos, character);
    }

    // Go to the next frame
    moveCursor(_focusDirection);
  }

  function removeLetter() {
    var pos = parseInt(_focusCell.getAttribute('data-pos'));

    if (_grid[pos].available == true) {
      _focusCell.innerHTML = '';
      
      // Notify grid that the letter has been removed
      _letterUpdateCallback(parseInt(_focusCell.getAttribute('data-pos')), null);
    }
  }



  /*-------------------------
      
      Public methods
  
  -------------------------*/

  /*
  * Register to click and keyboard events
  */
  Cursor.prototype.RegisterEvents = function () {
    var letterCases = document.querySelectorAll('.letter'),
        size,
        i;

    // For each letter case
    size = letterCases.length;
    for (i = 0; i < size; i++) {
      // Register click event for cursor
      letterCases[i].addEventListener('click', onClickReceived, false);
      // Register keydown event to get letter
      letterCases[i].addEventListener('keydown', onLetterPressed, false);
    };

  };


  return (Cursor);
  
});