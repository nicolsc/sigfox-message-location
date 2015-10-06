$(document).ready(function() {
  SIGFOX.loadMap();
  SIGFOX.initDeviceSearch();
  
  if (window.messages){
    var deviceId = SIGFOX.getIdFromLocation('device');
    //set input value

    $('#deviceId').val(deviceId);
    SIGFOX.showMessages(deviceId, messages);
  } 
  
});