var enumServerState = {
  WaitingForPlayers: 1,
  OnGame: 2
};

var enumPlayerState = {
  OnLoginScreen: 1,
  WaitingInLobby: 2,
  Playing: 3,
  Died: 4
};

var enumArrowDirection = {
  None: 0,
  Right: 1,
  Bottom: 2,
  RightBottom: 3,
  BottomRight: 4
};

var enumCaseType = {
  All: 1,
  Letter: 2,
  Description: 3,
  Empty: 4
};

var enumAxisType = {
  Horizontal: 0,
  Vertical:   1
};

exports.PlayerState     = enumPlayerState;
exports.ServerState     = enumServerState;
exports.ArrowDirections = enumArrowDirection;
exports.CaseType        = enumCaseType;
exports.AxisType        = enumAxisType;
