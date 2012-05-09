/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;


var toQueryString = function(obj) {
    if(obj) {
       var arr = [], key, value;
       for(var i in obj) {
           if(obj.hasOwnProperty(i)) {
               key = encodeURIComponent(i);
               value = encodeURIComponent(obj[i]);
               // @todo - handle arrays as value
               arr.push(key + '=' + value);
           }
       }
       return arr.join('&');
    }
    return '';
};

var request = function(uri, method, params) {

    params = params || {};
    method = method || 'get';
    var url = uri + '?' + toQueryString(params);

    console.log('Request: ' + url);

    var xhr = new XMLHttpRequest();
    xhr.timeout = 5000;
    xhr.open(method, url, true);
    xhr.send(null);

    return xhr;
};

exports.Main = Montage.create(Component, {

    currentConditionsEl: {value: null},
    
    zipTxtValue: {value: null},

    _zip: {value: null},
    zip: {
        get: function() {return this._zip;},
        set: function(value) {
            this._zip = value;
            this.getWeatherForZip();
        }
    },

    weather: {
        value: null
    },

    error: {
        get: function() {
            return this._error;
        },
        set: function(msg) {
            this._error = msg;
            this.weather = null;
        }
    },

    _setZipFromHash: {
        value: function() {
            var hash = window.location.hash;

            if(hash && hash.length > 0 && hash.indexOf('#') == 0) {
                this.zip = hash.substring(hash.indexOf('#')+1);
            }
        }
    },

    prepareForDraw: {
        value: function() {
            
        }
    },

    getWeatherForZip: {
        value: function() {

            var yql = 'select * from weather.forecast where location=' + this.zip + decodeURIComponent('%0A'); // linefeed
            var uri = 'http://query.yahooapis.com/v1/public/yql';
            var self = this;
            var xhr = request(uri, 'get', {q: yql, format: 'json'});
            xhr.onload = function(e) {
               try {
                   var res, item;
                   res = JSON.parse(this.response).query;
                   console.log('response received', res);
                   if(res) {
                       self.error = null;
                       self.weather = res.results.channel.item;
                   } else {
                       self.error = 'Error loading weather data';
                   }

               } catch(e) {
                   self.error = 'Error loading weather data';
               }
               self.needsDraw = true;
            };
            xhr.ontimeout = function() {
                self.error = 'Error loading weather data - request timed out';
                self.needsDraw = true;
            };
            xhr.onerror = function(e) {
                self.error = 'Error loading weather data - ' + e.message;
                self.needsDraw = true;
            };

        }
    },

    draw: {
        value: function() {
            console.log('main draw');
            if(this.weather) {
                this.currentConditionsEl.innerHTML = this.weather.description;
            } else {
                this.currentConditionsEl.innerHTML = '';
            }
        }
    },

    handleGoButtonAction: {
        value: function() {
            console.log('go button clicked ', this.zipTxtValue);
            if(this.zipTxtValue) {
                // also validate if valid zip
                this.zip = this.zipTxtValue;
            }
        }
    }

});
//http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20location%3D94087%0A&format=json
//http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20location%3D94087%0A&format=json
//http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20location%3D94087%0A&format=json&callback=