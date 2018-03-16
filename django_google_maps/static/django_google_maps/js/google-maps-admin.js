
/*
Integration for Google Maps in the django admin.

How it works:

You have an address field on the page.
Enter an address and an on change event will update the map
with the address. A marker will be placed at the address.
If the user needs to move the marker, they can and the geolocation
field will be updated.

Only one marker will remain present on the map at a time.

This script expects:

<input type='text' name='address' id='id_address' />
<input type='text' name='geolocation' id='id_geolocation' />

If the geolocation input has a data-loading-message attribute, it is displayed
below the address field's label.

<script type='text/javascript' src='http://maps.google.com/maps/api/js?sensor=false'></script>

*/

function googleMapAdmin() {
  var geocoder = new google.maps.Geocoder();
  var map;
  var marker;

  var addressField = $('#id_address');
  var geolocationField = $('#id_geolocation');
  var loadingLabel;

  var self = {
    initialize: function() {
      var lat = 0;
      var lng = 0;
      var zoom = 2;
      // set up initial map to be world view. also, add change
      // event so changing address will update the map
      existinglocation = self.getExistingLocation();
      if (existinglocation) {
        lat = existinglocation[0];
        lng = existinglocation[1];
        zoom = 18;
      }

      var latlng = new google.maps.LatLng(lat,lng);
      var myOptions = {
        zoom: zoom,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.HYBRID
      };
      map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);
      if (existinglocation) {
        self.setMarker(latlng);
      }
      var loadingMessage = geolocationField.data('loading-message');
      var loadingHtml = '<div id="loadingLabel" style="font-weight:bold; display:none; position:absolute;">'
          + loadingMessage + '</div>';
      if (!loadingLabel) {
        loadingLabel = $(loadingHtml).insertAfter(addressField);
      }

      autocomplete = new google.maps.places.Autocomplete(
        addressField[0],
        {types: ['geocode']}
      );

      // don't make enter submit the form, let it just trigger the place_changed event
      // which triggers the map update & geocode
      addressField.keydown(function(e) {
          if (e.keyCode == 13) {  // enter key
            self.codeAddress();
            e.preventDefault();
            return false;
          }
      });

      autocomplete.addListener('place_changed', function() {
        self.codeAddress();
      });
    },

    getExistingLocation: function() {
      var geolocation = geolocationField.val();
      if (geolocation) {
        return geolocation.split(',');
      }
    },

    codeAddress: function() {
      var address = addressField.val();
      geocoder.geocode({'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          var latlng = results[0].geometry.location;
          map.setCenter(latlng);
          map.setZoom(18);
          self.setMarker(latlng);
          self.updateGeolocation(latlng);
        } else {
          alert('Geocode was not successful for the following reason: ' + status);
        }
      });
    },

    setMarker: function(latlng) {
      if (marker) {
        self.updateMarker(latlng);
      } else {
        self.addMarker({'latlng': latlng, 'draggable': true});
      }
    },

    addMarker: function(Options) {
      marker = new google.maps.Marker({
        map: map,
        position: Options.latlng
      });

      var draggable = Options.draggable || false;
      if (draggable) {
        self.addMarkerDrag(marker);
      }
    },

    addMarkerDrag: function() {
      marker.setDraggable(true);
      google.maps.event.addListener(marker, 'dragend', function(new_location) {
        self.updateGeolocation(new_location.latLng);
      });
    },

    updateMarker: function(latlng) {
      marker.setPosition(latlng);
    },

    updateGeolocation: function(latlng) {
      geolocationField
        .val(latlng.lat() + ',' + latlng.lng())
        .trigger('change');
      loadingLabel.css('display', 'none');
    }
  }

  return self;
}

$(document).ready(function() {
  var googlemap = googleMapAdmin();
  googlemap.initialize();
});
