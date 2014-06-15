var util  = require('util'),
    enums = require('./enums');

function Case() {
  this.pos        = null;
  this.value      = null;
  this.dotted     = 0;
  this.theme      = false;
  this.type       = null;
};
Case.prototype.setThemeCase = function (isThemeCase) {
  this.theme = isThemeCase;
};
Case.prototype.setDotted = function (dots) {
  this.dotted = dots;
};


function LetterCase(Position, Content) {
  this.pos = Position;
  this.value = Content;
  this.type = enums.CaseType.Letter;
  
  this.available = true;
};

function DescriptionCase(Position, Content) {
  this.pos = Position;
  this.value = Content;
  this.type = enums.CaseType.Description;

  // If the content letter is a letter greater than 'd', we will have a frame with 2 descriptions inside
  this.nbDesc = (Content > 'd') ? 2 : 1;
  this.desc = [];
  this.arrow = [];
  this.desc[0] = null;
  this.arrow[0] = null;
  this.nbLines = this.nbDesc;
  
  // For more than 1 desc, initialize the other 
  if (this.nbDesc == 2) {
    this.desc[1] = null;
    this.arrow[1] = null;
  }
};

function EmptyCase(Position, Content) {
  this.pos = Position;
  this.type = enums.CaseType.Empty;
};

// Inheritances
util.inherits(LetterCase, Case);
util.inherits(DescriptionCase, Case);
util.inherits(EmptyCase, Case);


/*
* Try to put a description in this case
* If a description is already in there don't apply the new one and return false
* @param {String} description   The description to apply
* @return {Boolean}   True if the description is apply to this case, false either
*/
DescriptionCase.prototype.setDescription = function (description) {
  var desc;

  // If the first desc cell is available
  if (this.desc[0] == null) {
    // Replace \n by <br/>
    desc = description.replace(/\n/gi, '<br/>');

    this.nbLines += description.split('\n').length - 1;
    this.desc[0] = desc;
    return (true);
  }
  // Else check if the second one is available
  else if ((this.nbDesc == 2) && (this.desc[1] == null)) {
    // Replace \n by <br/>
    desc = description.replace(/\n/gi, '<br/>');

    this.nbLines += description.split('\n').length - 1;
    this.desc[1] = desc;
    return (true);
  }
  else
    return (false);
};


module.exports.EmptyCase = EmptyCase;
module.exports.LetterCase = LetterCase;
module.exports.DescriptionCase = DescriptionCase;
