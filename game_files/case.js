var util  = require('util'),
    enums = require('./enums');

function Case() {
  this.pos        = null;
  this.value      = null;
  this.dotted     = 0;
  this.theme      = false;
  this.direction  = enums.ArrowDirections.None;
  this.type       = null;
};

Case.prototype.getCase = function () {
  console.warn('This method needs to be overwritten !!!');
};

Case.prototype.setArrow = function (arrowDirection) {
  this.direction = arrowDirection;
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
  this.arrow = null;
};

function DescriptionCase(Position, Content) {
  this.pos = Position;
  this.value = Content;
  this.type = enums.CaseType.Description;

  this.nbDesc = (Content > 'd') ? 2 : 1;
  this.desc = [];
  this.desc[0] == null;
  this.nbLines = this.nbDesc;
  if (this.nbDesc == 2)
    this.desc[1] == null;
};

function EmptyCase(Position, Content) {
  this.pos = Position;
  this.type = enums.CaseType.Empty;
};

// Inheritances
util.inherits(LetterCase, Case);
util.inherits(DescriptionCase, Case);
util.inherits(EmptyCase, Case);


DescriptionCase.prototype.setDescription = function (description) {
  var desc;

  if (this.desc[0] == null) {
    // Replace \n by <br/>
    desc = description.replace(/\n/gi, '<br/>');

    this.nbLines += description.split('\n').length - 1;
    this.desc[0] = desc;
    return (true);
  }
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

LetterCase.prototype.getCase = function () {
  console.info('Surcharge de la fonction getCase() par l objet LetterCase ! :p');
};

DescriptionCase.prototype.getCase = function () {
  console.info('Surcharge de la fonction getCase() par l objet DescriptionCase ! xoxo');
};


module.exports.EmptyCase = EmptyCase;
module.exports.LetterCase = LetterCase;
module.exports.DescriptionCase = DescriptionCase;
