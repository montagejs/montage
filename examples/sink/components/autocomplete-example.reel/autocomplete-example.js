/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    JSONP = require('components/autocomplete-example.reel/jsonp.js').JSONP;


var toQueryString = function(obj) {
   if(obj) {
       var arr = [], key, value;
       for(var i in obj) {
           if(obj.hasOwnProperty(i)) {
               key = encodeURIComponent(i);
               value = encodeURIComponent(obj[i]);
               // @todo - handle arrays as value
               arr.push(key + encodeURIComponent('=') + value);
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

var jsonp = function(uri, params, callback) {
    JSONP.get(uri, params, callback);
};



exports.AutocompleteExample = Montage.create(Component, {

    json: {value: null},

    country: {value: null},
    state: {value: null},
    places: {value: null},
    info: {value: null},

    countryShouldGetSuggestions: {
        value: function(autocomplete, searchTerm) {

            var results = [];
            searchTerm = searchTerm.toLowerCase();

            if(searchTerm.indexOf('a') === 0) {
                results = ['Afghanistan', 'Algeria', 'Armenia'];
            } else if(searchTerm.indexOf('b') === 0) {
                results = ['Bosnia', 'Belarus'];
            } else {
                results = ['USA', 'India'];
            }

            //autocomplete.suggestions = results;
            // to simulate API call

            setTimeout(function() {
                autocomplete.suggestions = results;
            }, 1000);


        }
    },

    stateShouldGetSuggestions: {
        value: function(autocomplete, searchTerm) {
            var results = [];
            if(searchTerm === 'a') {
                results = ['Arkansas', 'Arizona'];
            } else if(searchTerm === 'c') {
                results = ['California'];
            } else {
                results = ['New York', 'Utah', 'Oregon', 'Washington', 'Nevada'];
            }
            //autocomplete.suggestions = results;

            setTimeout(function() {
                autocomplete.suggestions = results;
            }, 1000);
        }
    },

    placesShouldGetSuggestions: {
        value: function(autocomplete, searchTerm) {
            var results = [];
            //var uri = 'http://jqueryui.com/demos/autocomplete/search.php';
            //var uri = 'http://api.twitter.com/1/geo/search.json';
            /*
            console.log('searching ...', uri);
            var xhr = request(uri, 'get');
            xhr.onload = function(e) {
               try {
                   var data;
                   data = JSON.parse(this.response);
                   var result = [];
                   if(data && data.length > 0) {
                       result = data.map(function(item) {
                           return item.label;
                       });
                   }
                   autocomplete.suggestions = result;

               } catch(e) {
                   autocomplete.suggestions = [];
               }

            };
            xhr.ontimeout = function() {
               console.log('xhr timed out');
               autocomplete.suggestions = [];
            };
            xhr.onerror = function(e) {
                console.log('xhr errored out');
               autocomplete.suggestions = [];
            };
            */

            JSONP.request('https://api.twitter.com/1/geo/search.json', {query: searchTerm, granularity: 'city'}, function(data) {
                var result = [];
                console.log('received data', data);
                if(data && data.result && data.result.places && data.result.places.length > 0) {
                    result = data.result.places.map(function(item) {
                        return item.name;
                    });
                }
                console.log('result', result);
                autocomplete.suggestions = result;
            });


        }
    },

    prepareForDraw: {
        value: function() {
            this.country = "Foo";
            this.state = "Bar";
        }
    },

    handleUpdateAction: {
        value: function(event) {
            this.json = JSON.stringify({
                country: this.country,
                state: this.state,
                places: this.places,
                info: this.info

            });
        }
    }
});
