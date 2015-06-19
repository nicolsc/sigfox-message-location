$(document).ready(function() {
  SIGFOX.initDeviceSearch();
  if (window.baseStation){
    var deviceId = SIGFOX.getIdFromLocation('station');
    //set input value

    $('#deviceId').val(deviceId);
    SIGFOX.showBaseStationInfo(deviceId, baseStation);
  }
    
});