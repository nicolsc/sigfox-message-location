(function(){
  window.SIGFOX = {
    GMAPS_KEY : 'AIzaSyBPUHmaNk9Xb03ttmk7R46deW6XXaGdbck',
    map: undefined,
    markers: [],
    initDeviceSearch: function(){
      $('#btnSearchDeviceId').click(function(evt){
        this.showStatus('.. Please wait ..');
        $('.row-messages').addClass('hidden');

        var inputField = $('#deviceSearchForm #deviceId');
        var deviceId = inputField.val();
        if (!this.isValidDeviceId(deviceId)){
          inputField.parent().addClass('has-error');
          this.showWarning("Invalid device id");
          return false;
        }

        this.searchDevice(deviceId);
        return false;
      }.bind(this));
    },
    showStatus: function(msg, type){
      var bg;
      switch(type){
          case 'success':
          case 'warning':
            bg = type;
            break;
          case 'error':
            bg = 'danger';
            break;
          default:
            bg = 'info';
      }

      $('#status').removeClass().addClass('bg-'+bg).text(msg).show();

    },
    searchDevice: function(deviceId){
      $.ajax({
        url: '/devices/'+deviceId+'/messages'
      })
      .done(function(data){
        this.showMessages(deviceId, data);
      }.bind(this))
      .fail(this.showError.bind(this));

    },
    showMessages: function(deviceId, messages){
      this.showStatus('Displaying '+messages.length+' messages', 'success');
      var $messages = $('.row-messages');
      $('h3', $messages).text('Device '+deviceId);



      $('tbody', $messages).html('');
      var row;
      messages.forEach(function(msg){
        row = '<tr data-stations=\''+JSON.stringify(msg.rinfos)+'\'>';
        row += '<td class="date">'+moment(msg.time*1000).format()+'<br />'+moment(msg.time*1000).fromNow()+'</td>';
        row += '<td class="data">'+(msg.seqNumber ? msg.seqNumber : '-')+'</td>';
        row += '<td class="data">'+encodeURIComponent(msg.data)+'</td>';
        row += '<td class="stations">';
        if (msg.rinfos && msg.rinfos.length){
          row += msg.rinfos.length+' stations received this message<pre>';
          msg.rinfos.forEach(function(baseStation){

            row += '<a href="/basestations/'+baseStation.tap+'">'+baseStation.tap+' ('+ baseStation.rssi +'dBm)</a>';
            row += '&nbsp;\t'+(Math.floor(baseStation.lat*100)/100)+','+(Math.floor(baseStation.lng*100)/100)+'°';
            //row += '\t'+baseStation.lat+' , '+baseStation.lng;
            row += '\n';
          });
          row += '</pre>';
        }
        else{
          row += 'Information not available';
        }
        row += '</td>';
        row += '<td class="location">';
        var map = this.getMessageStaticMap(msg);
        if (map){
          row += map;
        }
        else{
          row += 'N/A';
        }
        row += '</td>';
        row += '</tr>';

        $('tbody', $messages).append(row);
      }.bind(this));

      this.pushState('/devices/'+deviceId+'/messages');
      $('h5 a', $messages).attr('href', window.location.pathname+'.csv');

      $messages.removeClass('hidden');


      $('#status').hide(5000);
    },
    showBaseStationInfo:function(id, data){
      var $baseStation = $('.row-baseStation');
      $('h3', $baseStation).text('Base station '+id);
      
      var toDisplay = [];
      toDisplay.push({
        label : "Name",
        value : data.name
      });
      toDisplay.push({
        label : "Production ?",
        value : data.lifecycleStatus
      });
      toDisplay.push({
        label : "Altitude",
        value : data.elevation+' m'
      });
      toDisplay.push({
        label : "Location",
        value : data.latitude+'° , '+data.longitude+'°'
      });
      toDisplay.push({
        label : "State",
        value : data.state,
        css : data.state === 'OK' ? 'success' : 'danger' 
      });
      toDisplay.push({
        label : "Downlink enabled",
        value : data.downlinkEnabled
      });
      toDisplay.push({
        label : "Connection",
        value : data.connection
      });
      
      
      var html = '', css;
      toDisplay.forEach(function(entry){
        css = (typeof entry.css !== 'undefined' ? entry.css : '');
        html += "<tr><th class='"+css+"'>"+entry.label+"</th><td class='"+css+"'>"+entry.value+"</td>";
      });
      
      $('.info table', $baseStation).html(html);
      
      $('.map', $baseStation).html(
        SIGFOX.getBaseStationStaticMap(data, {zoom:5, size:'275x225'})
        +
        SIGFOX.getBaseStationStaticMap(data, {zoom:11, size:'275x225'})
      );
      
      
    },
    getStaticMap: function(params){
        var defaultParams = {
        size: '300x150',
        type: 'roadmap'
      };

      if (!params){
        params = defaultParams;
      }
      Object.keys(defaultParams).forEach(function(key){
        if (typeof params[key] === 'undefined'){
          params[key] = defaultParams[key];
        }
      });

      var uri = 'https://maps.googleapis.com/maps/api/staticmap?key='+this.GMAPS_KEY+'&size={size}&maptype={mapType}';
      //uri = uri.replace('{center}', getStaticMapCoord(params.center));
      
      uri = uri.replace('{mapType}', params.type);
      uri = uri.replace('{size}', params.size);
      
      if (params.zoom){
        uri += "&zoom="+params.zoom;
      }
      
      if (params.center){
        uri += '&center='+this.getTextCoord(params.center);
      }
      
      return uri;
    },
    getStaticMapTag: function(uri){
      //2048 chars max
      // + cut at the last & to avoid incomplete params leading to unpredictable stuff, such as misplaced markers
      return '<img src="'+(uri+'&').substring(0,2048).replace(/\&([^\&])*$/, '')+'" />';
    },
    getMessageStaticMap: function(message, params){
      if (!message || !message.rinfos || !message.rinfos.length){
        return null;
      }
      
      var markersColors = ["black", "brown", "green", "purple", "yellow", "blue", "gray", "orange", "red", "white"];

      var uri = this.getStaticMap(params);
      message.rinfos.forEach(function(baseStation, idx){
        if (typeof baseStation.lat === 'undefined' || typeof baseStation.lng === 'undefined'){
          console.log('Base station location unknown', baseStation);
          return;
        }
        uri += '&markers=size:mid%7ccolor:'+markersColors[idx%markersColors.length]+'%7C'+this.getTextCoord(baseStation);
      }.bind(this));

      return this.getStaticMapTag(uri);
    },
    setMessageMarkers: function(stations){
      var marker;
      
      stations.forEach(function(station){
        var marker = this.getMarker(station.lat, station.lng, this.getStationMarkerTooltip(station));
        this.markers.push(marker);        
      }.bind(this));
      
    },
    getStationMarkerTooltip: function(station){
      var str =  'Station '+station.tap+'\n'+station.lat+'°,'+station.lng+'°';
      if (station.rssi){
        str += "\n"+station.rssi+" dBm";
      }
      return str;
      
    },
    getMarker: function(lat, lng, title){
      return new google.maps.Marker({
        map:this.map,
        position: this.getLocation(lat, lng),
        title : title || (lat+'°, '+lng+'°')
      });
    },
    getLocation: function(lat, lng){
      return new google.maps.LatLng(lat, lng);
    },
    fitMapToMarkers: function(){
      var bounds = new google.maps.LatLngBounds();
      this.markers.forEach(function(marker){
        bounds.extend(marker.position);
      });
      this.map.fitBounds(bounds);
    },
    clearMarkers:function(){
      this.markers.forEach(function(marker){
        console.log('marker', marker)
        marker.setMap(null);
      });
      this.markers = [];
    },
    getBaseStationStaticMap: function(baseStation, params){
      var uri = this.getStaticMap(params);
      uri += '&markers=size:mid%7ccolor:green%7C'+this.getTextCoord({lat:baseStation.latitude, lng:baseStation.longitude});
      
      return this.getStaticMapTag(uri);
    },
    getTextCoord: function(latLng){
      if (!latLng || typeof latLng.lat==='undefined' || typeof latLng.lng==='undefined'){
        return null;
      }
      return latLng.lat+','+latLng.lng;

    },
    showError:function(err){
      this.showStatus(err.message, 'error');
    },
    getIdFromLocation: function(type){
      var regex;
      switch(type){
          case 'device':
            regex =  /devices\/([0-9a-fA-F]{2,10})\//;
            break;
          case 'station':
            regex = /basestations\/([0-9a-fA-F]{2,10})/;
      }
      var extract= regex.exec(window.location.pathname);
       if(extract && extract instanceof Array){
        return extract.pop().toUpperCase();
      }
      else{
        return null;
      }
    },
    isValidDeviceId: function(deviceId){
      return /^([0-9a-fA-F]{2,10})$/.test(deviceId);
    },
    pushState: function(hash){
      window.history.pushState(hash, hash, hash);
    },
    loadMap: function(){
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&callback=gmapsCallback';
      document.body.appendChild(script);
    }
    
  };
  
  
})();
function gmapsCallback(){
  $('.row-map').removeClass('hidden');

  var options = {
    center: new google.maps.LatLng(49,2),
    zoom: 8
  };
  
  SIGFOX.map = new google.maps.Map(document.getElementById('map'),options);
  $('.row-map').addClass('hidden');
}