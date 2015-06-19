$(document).ready(function() {
  SIGFOX.initDeviceSearch();
  if (window.messages){
    var deviceId = SIGFOX.getIdFromLocation('device');
    //set input value

    $('#deviceId').val(deviceId);
    SIGFOX.showMessages(deviceId, messages);
  }
    
});