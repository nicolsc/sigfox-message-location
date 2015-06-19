'use strict';
const debug = require('debug')('message-localisation:csv');
var express = require('express');
const sep = ';';
const EOL = '\r\n';

express.response.csv = function(tab, fileName){
  debug('res.csv');
  if (!tab || !tab instanceof Array){
    return new Error('CSV output must be an array');
  }
  if (!fileName){
    fileName = 'whatever.csv';
  }
  let rawCsv = '';
  
  
  tab.forEach(function(entry){
    if (!tab instanceof Array){
      entry = toArray(entry);
    }
    
    rawCsv += entry.map(safeExport).join(sep)+EOL;
  });
  this.setHeader('Content-Type', 'text/csv');
  this.setHeader('Content-Disposition', 'attachment; filename='+fileName);
  this.send(rawCsv);
};

function toArray(item){
  if (item instanceof Object){
    var tab=[];
    for (var key in item){
      if (item.hasOwnProperty(key)){
        tab.push(item[key]);
      }
    } 
    return tab;
  }
  else{
    return [item];
  }
}
function safeExport(item){
  return String(item).replace('"', '"""').replace(sep, ' ');
  
}


module.exports = function(){};
