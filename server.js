'use strict';
require('./loadConfig');

const debug = require('debug')('message-localisation:app');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');

const SIGFOX =require('./modules/sigfox');
const csv = require('./modules/csv');
const auth = require('./modules/auth');

/* init */
const app = express();
const port = process.env.PORT || 34004;
const server = http.createServer(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.locals.moment = require('moment');

SIGFOX.init(process.env.SIGFOX_USERNAME, process.env.SIGFOX_PASSWORD);


server.listen(port);

if (process.env.LOGIN && process.env.PASSWORD){
  app.use('*',auth.basic);
}



app.get('/', function(req, res, next){
 res.render('home');
});
app.get('/devices/:deviceid/messages\.:extension?', function(req, res, next){
  debug('/messages routes');
  debug('deviceid\t:\t'+req.params.deviceid);
  debug('extension\t:\t'+req.params.extension);
  
  
  //If an explicit extension is provided, simulate the matching request headers
  switch(req.params.extension){
    case 'json':
      req.headers.accept = 'application/json';
      break;
    case 'csv':
      req.headers.accept = 'text/csv';
      break;
    case 'html':
        req.headers.accept = 'text/html';
        break;
    default:
        //do nothing
  }
  debug(req.headers.accept);
  
  SIGFOX.getDeviceMessages(req.params.deviceid)
  .then(function(response){
    let messages;
    if (!response || !response.data){
      messages =  [];
    }
    else{
      messages = response.data;
    }
    res.format({
      //default */* to json
      json: function(){
        res.json(messages);
      },
      html:function(){
        res.render('home', {data:messages});
      },
      csv: function(){
        //Format for csv exports 
        let csv = [];
        //Line 1 : headers  
        csv.push(['device', 'msgSequenceNumber', 'date', 'payload', 'baseStationID', 'baseStationLat', 'baseStationLng', 'rssi']);
        messages.forEach(function(entry){
          entry.rinfos.forEach(function(baseStation){
            debug('bs', baseStation.tap);
            csv.push([entry.device, entry.seqNumber, new Date(entry.time*1000).toISOString(), entry.data, baseStation.tap, baseStation.lat, baseStation.lng, baseStation.rssi]);
          });
        });
        
        
        
        res.csv(csv, 'devices-'+req.params.deviceid+'-messages.csv');
      }
    });
  })
  .catch(function(err){
    next(new Error('An error occured while fetching messages - '+err.message));
  });
});

app.get('/basestations/:id\.:extension?', function(req, res, next){
  debug('/basestations routes');
  debug('deviceid\t:\t'+req.params.id);
  debug('extension\t:\t'+req.params.extension);
  
  
  //If an explicit extension is provided, simulate the matching request headers
  switch(req.params.extension){
    case 'json':
      req.headers.accept = 'application/json';
      break;
    case 'csv':
      req.headers.accept = 'text/csv';
      break;
    case 'html':
        req.headers.accept = 'text/html';
        break;
    default:
        //do nothing
  }
  
  
  SIGFOX.getBaseStation(req.params.id)
  .then(function(response){
    
    res.format({
      //default */* to json
      json: function(){
        res.json(response);
      },
      html:function(){
        res.render('basestation', {data:response});
      }
    });
  })
  .catch(function(err){
    debug('getBaseStation err');
    debug(err);
    next(new Error('An error occured while fetching base station info'));
  });
});
//404 handling
app.use(function(req, res, next) {
  debug('404');
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  debug('Err  ?'+err.status);
  res.status(err.status || 500);
  res.format({
    json:function(){
      return res.json({err:err});
    },
    html:function(){
      return res.render('error', {
        err: err
      });
    },
    default:function(){
      res.send();
    }
  });
});

server.on('error', function(err){
    debug('ERROR %s', err);
});
server.on('listening', function(){
 debug('Server listening on port %s', port); 
});