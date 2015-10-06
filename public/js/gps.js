"use strict";
/**
* @function
* Get GPS Coords from an hex frame
* @param {String} hex frame
* @return {Object} lat:float, lng:float
**/
function getGPSCoords(payload){
  console.log('getGPSCOords', payload);
  if (!payload){
    console.log('Empty payload');
    
    return {lat:null, lng:null};
  }
  var data = getFrameComposition(payload);
  if (!data){
    console.log('Invalid GPS  frame - %s', payload);
    return {lat:null, lng:null};
  }
  
  if (!data.geoloc || !validationCheck(data)){
    console.log('No geoloc data (%s)', data.geoloc);
    return {lat:null, lng:null};
  }
  return _getLatLng(data.latlng, data.latsign, data.lngsign);
}
/**
* @function
* Get the composition of a TD GPS frame
* @param {string} frame in hexa
* @return {Object} geoloc, latlng, lngsign, latsign
**/
function getFrameComposition(frameHex){
  console.log('getFrameComposition', frameHex);
  var frame =  getFramePattern().exec(getFrameBinary(frameHex));
  if (!frame){
    console.log('Frame doesn\'t match expected pattern : %s',frameHex);
    return null;
  }
  
  return {
    geoloc : frame[2],
    latlng : frame[4],
    lngsign : frame[6],
    latsign : frame[7]
  };
}
/**
* @function
* Get the binary string of an hex frame
* @param {String} frame in hex
* @return {String} frame in binary
**/
function getFrameBinary(frameHex){
  console.log('getFrameBinary', frameHex);
  var bytes = frameHex.match(/.{1,2}/g);
  if (bytes.length !== 12){
    console.log('Invalid frame, got %s bytes', bytes.length);
    return null;
  }
  var binaryString='';
  bytes.forEach(function(byte){
    binaryString += getBinaryFromHex(byte);
  });
  if (!binaryString.match(/^([0-9]*)$/)){
    console.log('Unable to parse frame %s : %s', frameHex, binaryString);
    return null;
  }
  return binaryString;
  
}
/**
* @function
* Get binary value of an hex byte
* @param {String} byte
* @return {String} binary
**/
function getBinaryFromHex(byte){
  var num = Number(parseInt(byte, 16));
  if (isNaN(num)){
    console.log('Invalid byte %s', byte);
    return null;
  }
  var binary = num.toString(2);
  
  //Fill the byte with zeros
  while (binary.length < 8){
    binary ='0'+binary;
  }
  
  return binary;
}

/**
* @function
* Get lat/lng values from the 48bit section of the frame + the 2 bits re: +/-
* Variables:
* var_0: [Long] (#latlng % 10000000) / 100000
* var_1: [Double] (#latlng % 100000) / 1000d / 60d
* var_2: [Long] #latlng / 1000000000000L
* var_3: [Double] (#latlng % 1000000000000L - #latlng % 10000000) / 10000000d / 1000d / 60d
* Latitude definition: (#var_0 + #var_1) * (#latsign == 0 ? 1 : -1)
* Longitude definition: (#var_2 + #var_3) * (#lngsign == 0 ? 1 : -1)
* @param {String} latLng in binary
* @param {int} latSign +1 or -1
* @param {int} lngSign +1 or -1
*@return {Object} lat:float, lng:float
**/
function _getLatLng(latLng2, latSign, lngSign){
  console.log('_getLatLng', latLng2);
  //if the 48 bits are all set to 1, this means there was a GPS issue. return null;
  if (latLng2.match(/1{48}/)){
    return {
      lat:null, 
      lng:null
    };
  }
  
  var latLng10 = parseInt(latLng2, 2) ;

  var var0 = parseInt((latLng10  % 10000000) / 100000, 10);
  var var1 = (latLng10 % 100000) / 1000/ 60 ;
  var var2 = parseInt(latLng10 / 1000000000000, 10);
  var var3 = parseInt((latLng10 % 1000000000000 - latLng10 % 10000000) / 10000000, 10) / 1000 / 60;
  
  var lat = (var0 + var1) * (latSign === '0' ? 1 : -1);
  var lng = (var2 + var3) * (lngSign === '0' ? 1 : -1);
  
  if (!isValidLng(lat)){
    console.log('Invalid lat value %s', lat);
    lat = null;
  }
  
  if (!isValidLng(lng)){
    console.log('Invalid lng value %s', lat);
    lng = null;
  }
  
  return {
    lat: lat,
    lng: lng
  };
}
function isValidLat(lat){
  lat = Number(lat);
  
  if (isNaN(lat)){
    return false;
  }
  
  if (lat < -90 || lat > 90){
    return false;
  }
  
  return true;
}
function isValidLng(lng){
  lng = Number(lng);
  
  if (isNaN(lng)){
    return false;
  }
  
  if (lng < -180 || lng > 180){
    return false;
  }
  
  return true;
}
/**
* @function
* Checks that frame contains gps position, using the geoloc part
* @param {String} frame in binary
* @return {bool} valid gps position
**/
function validationCheck(frame){
   return parseInt(frame.geoloc,2) === 0x101;
}
/**
* @function
* Get frame composition pattern
* @return {RegExp}
**/
function getFramePattern(){
  return /(.{12})(.{12})(.{4})(.{48})(.{12})(.)(.)/;
}
