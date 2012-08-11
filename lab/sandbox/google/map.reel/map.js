/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**

    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
 @class module:"montage/ui/google/map.reel".Map
 @extends module:montage/ui/component.Component
 */
var Map = exports.Map = Montage.create(Component, /** @lends module:"montage/ui/toggle-switch.reel".ToggleSwitch# */ {

    didCreate: {
        value: function() {
            var self = this;

            window.initialize = function initialize() {
                self._mapLoaded = true;
                self._geoCoder = new google.maps.Geocoder();
                self.center = self._center;
                self.needsDraw = true;
            };
        }
    },

    _geoCoder: {value: null},

    // HTMLElement to load the Map into
    mapEl: {
        serializable: true,
        value: null
    },

    _mapLoaded: {
        enumerable: false,
        value: false
    },
    _map: {
        enumerable: false,
        value: false
    },

    // Sunnyvale, CA
    defaultLatLng: {
        value: {lat: 37.37, lng: -122.03}
    },

    _latLng: {
        value: null
    },

    latLng: {
        get: function() {
            return this._latLng;
        },
        set: function(value) {
            if(value) {
                this._latLng = value;
                // refresh the map
                this.needsDraw = true;
            }
        }
    },

    // {lat, lon} Or a String representing the location (eg: Paris, France)
    center: {
        serializable: true,
        get: function() {
            return this._center;
        },
        set: function(value) {
            if(value) {
                var self = this, geocoder = this._geoCoder;
                this._center = value;
                if(this._mapLoaded) {

                    if(String.isString(value)) {
                        // geocode
                        self.LatLng = null;
                        geocoder.geocode( { 'address': value}, function(results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                var loc = results[0].geometry.location;
                                self.latLng = {lat: loc.lat(), lng: loc.lng()};
                                self.category = self._category;
                            } else {
                                console.log('Geocode was not successful : ' + status);
                            }
                        });
                    } else if(value.lat && value.lng) {
                        this.latLng = value;
                    } else {
                         // default location
                         this.latLng = this.defaultLatLng;
                    }

                }

            }

        }
    },

    category: {
        serializable: true,
        get: function() {
            return this._category;
        },
        set: function(value) {
            if(value) {
                this._category = value;
                if (this._map && this.latLng) {
                    this._getPlaces(this._category);
                }
            } else {
                this._places = [];
            }

            this.needsDraw = true;
        }
    },

    trafficLayer: {value: null},
    _traffic: {value: null},
    traffic: {
        get: function() {
            return this._traffic;
        },
        set: function(value) {
            if(value !== this._traffic) {
                this._traffic = value;
                this.needsDraw = true;
            }
        }
    },


    zoomValue: {
        value: 13
    },

    __places: {value: null},
    _places: {
        get: function() {
            return this.__places;
        },
        set: function(value) {
            if(value) {
                this.__places = value;
                this.needsDraw = true;
            }
        }
    },

    _getPlaces: {
        value: function(type, keyword) {
            var self = this;
            var request = {
                location: new window.google.maps.LatLng(this.latLng.lat, this.latLng.lng),
                radius: 5000,
                types: [type]
            };
            if(!this._infoWindow) {
                this._infoWindow = new google.maps.InfoWindow();
            }
            var service = new google.maps.places.PlacesService(this._map);
            service.search(request, function(results, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    self._places = results;
                } else {
                    self._places = [];
                }
                self.needsDraw = true;
            });
        }
    },

    _infoWindow: {value: null},
    _markers: {value: null},
    _createMarker: {
        value: function(place) {
            var placeLoc = place.geometry.location, map = this._map;
            var icon, image;
            switch(this.category) {
                case 'restaurant':
                icon = 'fork-and-knife.png';
                break;
                case 'hospital':
                icon = 'medical.png';
                break;
                case 'bar':
                icon = 'beer-mug.png';
                break;
                case 'grocery_or_supermarket':
                icon = 'shopping.png';
                break;
                case 'museum':
                icon = 'picture-frame.png';
                break;
                case 'gas_station':
                icon = 'fuel.png';
                break;
                case 'cafe':
                    icon = 'cafe.png';
                    break;
            }

            if(icon) {
                image = new google.maps.MarkerImage(this._montage_metadata.require.modules['map.reel/map'].directory + 'icons/' + icon);
            }
            var options = {
                map: map,
                position: place.geometry.location
            };
            if(image) {
                options.icon = image;
            }

            var marker = new google.maps.Marker(options);
            if(!this._markers) {
                this._markers = [];
            }
            this._markers.push(marker);

            var infoWindow = this._infoWindow;
            google.maps.event.addListener(marker, 'click', function() {
                infoWindow.setContent(place.name + '<br/>' + place.vicinity);
                infoWindow.open(map, this);
            });
        }
    },

    _removeAllMarkers: {
        value: function() {
            if(this._markers && this._markers.length > 0) {
                var i=0, len = this._markers.length;
                for(i; i< len; i++) {
                    this._markers[i].setMap(null);
                }
                this._markers = [];
            }
        }
    },


/**
    Description TODO
    @function
    */
    draw: {
        enumerable: false,
        value: function () {
            if(this._mapLoaded) {
                var latLng = this.latLng;

                if (!latLng) {
                    if (this._center) {
                        return;
                    } else {
                        latLng = this.defaultLatLng;
                    }
                }

                if(!this._map) {
                    var map;
                    var myOptions = {
                        zoom: this.zoomValue,
                        center: new window.google.maps.LatLng(latLng.lat, latLng.lng),
                        mapTypeId: window.google.maps.MapTypeId.ROADMAP
                    };

                    this._map = new window.google.maps.Map(this.mapEl, myOptions);
                    this.center = this._center;
                    this.category = this._category;
                 }

                 var map = this._map;
                 //map.setZoom(10);
                 var latLng = new window.google.maps.LatLng(latLng.lat, latLng.lng);
                 map.setCenter(latLng);
                 var marker = new google.maps.Marker({
                     map: map,
                     position: latLng
                 });

                 var places = this._places;
                 if(places && places.length > 0) {
                     //map.setZoom(13);
                     this._removeAllMarkers();
                     for (var i = 0; i < places.length; i++) {
                         this._createMarker(places[i]);
                     }
                 } else {
                     this._removeAllMarkers();
                 }

                 if(this.traffic === true) {
                     this.trafficLayer = new google.maps.TrafficLayer();
                     this.trafficLayer.setMap(map);
                 } else {
                     if(this.trafficLayer) {
                         this.trafficLayer.setMap(null);
                     }
                 }
            }

              //window.google.maps.event.addDomListener(window, 'load', initialize);
        }
    },

    serializeProperties: {
        value: function(serializer) {
            serializer.set("element", this.element);
            serializer.set("category", this.category);
            serializer.set("center", this.center);
        }
    }
});