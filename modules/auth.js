var basicAuth = require('basic-auth');
var debug = require('debug')('message-localisation:debug');
  exports.basic = function(req, res, next) {
    var credentials = basicAuth(req);
  
  if (!credentials || credentials.name !== process.env.LOGIN || credentials.pass !== process.env.PASSWORD) {
    debug("Bad credentials ☹", credentials);
    res.status(401);
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    res.send('Please login');
    return false;
  }
  debug("Credentials OK");
  next();
};