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
    members: {value: null},
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

    membersShouldGetSuggestions: {
        value: function(autocomplete, searchTerm) {
            var results = [];
            // The data set is based on https://www.google.com/fusiontables/DataSource?docid=1QJT7Wi2oj5zBgjxb2yvZWA42iNPUvnvE8ZOwhA
            // Google fusion tables # 383121. However Google's API returns a CSV. So need to use this app to convert to json
            var query = "SELECT FirstName,LastName from 383121 where FirstName like '%" + searchTerm + "%'"; //" OR LastName like '%" + searchTerm + "%'";
            var uri = 'http://ft2json.appspot.com/q?sql=' + encodeURIComponent(query);
                        
            console.log('searching ...', uri);
            var xhr = request(uri, 'get');
            xhr.onload = function(e) {
               try {
                   var data;
                   data = JSON.parse(this.response).data;
                   var result = [];
                   if(data && data.length > 0) {
                       result = data.map(function(item) {
                           return item.FirstName + ' ' + item.LastName;
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
            

            /*
            JSONP.request(, null, function(data) {
                var result = [];
                console.log('received data', data);
                if(data && data.length > 0) {
                    result = data.result.places.map(function(item) {
                        return item.FirstName;
                    });
                }
                console.log('result', result);
                autocomplete.suggestions = result;
            });
            */

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
                members: this.members,
                info: this.info

            });
        }
    }
});
