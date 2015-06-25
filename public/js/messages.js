$(document).ready(function() {
  SIGFOX.loadMap();
  SIGFOX.initDeviceSearch();
  
  if (window.messages){
    var deviceId = SIGFOX.getIdFromLocation('device');
    //set input value

    $('#deviceId').val(deviceId);
    SIGFOX.showMessages(deviceId, messages);
  } 
  
  
   
  $('table#messages .location').on('click', function(evt){
    try{
      var stations = JSON.parse(evt.currentTarget.parentNode.attributes['data-stations'].value);
      SIGFOX.setMessageMarkers(stations);
    }
    catch (e){
      console.warn('Error wile parsing message stations ', e);
    }
    $('#modal-map').modal();
    google.maps.event.trigger(map, 'resize');
    SIGFOX.fitMapToMarkers();
  });
  
  
});