var config  = require('../conf.json')

/*
 * GET home page.
 */
exports.index = function(req, res) {
  res.render('mfl', { title: 'MotsFleches.js', wsAddress: config.SOCKET_ADDR + ':' + config.SOCKET_PORT });
};
