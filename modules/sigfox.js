var request = require('request-promise');
const debug = require('debug')('message-localisation:sigfox');

var SIGFOX = {
  _username : undefined,
  _password : undefined,
  _apiRoot : 'https://backend.sigfox.com/api/',
  init: function(username, password){
    this._username = username;
    this._password = password;
  },
  getDeviceMessages: function(deviceId){
    var ts = Math.round(new Date().getTime() * 0.001);
    return this._apiCall('devices/'+deviceId+'/messages?before='+ts);
  },
  getBaseStation: function(baseStationId){
    return this._apiCall('basestations/'+baseStationId);
  },
  _apiCall: function(url){
    return new Promise(function(resolve, reject){
      debug('API Call — '+this._apiRoot+url);
      request.get(this._apiRoot+url, {
        json:true,
        auth:{
          user: this._username,
          pass: this._password
        }
      })
      .then(resolve)
      .catch(reject);
      
    }.bind(this));
  },
  isValidDeviceId: function(deviceId){
    return /^([0-9a-fA-F]{2,10})$/.test(deviceId);
  }
};

module.exports = SIGFOX;