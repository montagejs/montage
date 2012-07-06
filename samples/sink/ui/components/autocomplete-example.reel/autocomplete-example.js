/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage/core/core").Montage,
    logger = require("montage/core/logger").logger("autocomplete-example"),
    Component = require("montage/ui/component").Component;

// Sample data for list of US States
var states = [
    {name: "Alabama", code: "AL" },
    {name: "Alaska", code: "AK"},
    {name: "Arizona", code: "AZ"},
    {name: "Arkansas", code: "AR"},
    {name: "California", code: "CA"},
    {name: "Colorado", code: "CO"},
    {name: "Connecticut", code: "CT"},
    {name: "Delaware", code: "DE"}, 
    {name: "District Of Columbia", code: "DC"},
    {name: "Florida", code: "FL"},
    {name: "Georgia", code: "GA"},
    {name: "Hawaii", code: "HI"},
    {name: "Idaho", code: "ID"},
    {name: "Illinois", code: "IL"},
    {name: "Indiana", code: "IN"},
    {name: "Iowa", code: "IA"},
    {name: "Kansas", code: "KS"},
    {name: "Kentucky", code: "KY"},
    {name: "Louisiana", code: "LA"},
    {name: "Maine", code: "ME"},
    {name: "Maryland", code: "MD"},
    {name: "Massachusetts", code: "MA"},
    {name: "Michigan", code: "MI"},
    {name: "Minnesota", code: "MN"},
    {name: "Mississippi", code: "MS"},
    {name: "Missouri", code: "MO"},
    {name: "Montana", code: "MT"},
    {name: "Nebraska", code: "NE"},
    {name: "Nevada ", code: "NV"},
    {name: "New Hampshire", code: "NH"},
    {name: "New Jersey", code: "NJ"},
    {name: "New Mexico", code: "NM"},
    {name: "New York", code: "NY"},
    {name: "North Carolina", code: "NC"},
    {name: "North Dakota", code: "ND"},
    {name: "Ohio", code: "OH"},
    {name: "Oklahoma ", code: "OK"},
    {name: "Oregon", code: "OR"},
    {name: "Pennsylvania", code: "PA"},
    {name: "Rhode Island", code: "RI"},
    {name: "South Carolina", code: "SC"},
    {name: "South Dakota", code: "SD"},
    {name: "Tennessee", code: "TN"},
    {name: "Texas", code: "TX"},
    {name: "Utah", code: "UT"},
    {name: "Vermont", code: "VT"},
    {name: "Virginia", code: "VA"},
    {name: "Washington", code: "WA"},
    {name: "West Virginia", code: "WV"},
    {name: "Wisconsin", code: "WI"},
    {name: "Wyoming", code: "WY"}
];

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
    if (logger.isDebug) {
        logger.debug('Request: ' + url);
    }


    var xhr = new XMLHttpRequest();
    xhr.timeout = 5000;
    xhr.open(method, url, true);
    xhr.send(null);

    return xhr;
};


exports.AutocompleteExample = Montage.create(Component, {

    json: {value: null},
    states: {value: null},
    members: {value: null},
    info: {value: null},

    _cachedStates: {value: null},

    stateShouldGetSuggestions: {
        value: function(autocomplete, searchTerm) {
            var results = [];
            if(searchTerm) {
                var term = searchTerm.toLowerCase();
                if(this._cachedStates && this._cachedStates[term]) {
                    results = this._cachedStates[term];
                } else {
                    results = states.filter(function(item) {
                        // @todo - memoize
                        return (item.name.toLowerCase().indexOf(term) >= 0 || item.code.indexOf(term) >= 0);
                    });
                    if(this._cachedStates == null) {
                        this._cachedStates = {};
                    }
                    this._cachedStates[term] = results;
                }
            }
            autocomplete.suggestions = results.map(function(item) {
                return item.name;
            });
        }
    },

    membersShouldGetSuggestions: {
        value: function(autocomplete, searchTerm) {
            var results = [];
            // The data set is based on https://www.google.com/fusiontables/DataSource?docid=1QJT7Wi2oj5zBgjxb2yvZWA42iNPUvnvE8ZOwhA
            // Google fusion tables # 383121. However Google's API returns a CSV. So need to use this app to convert to json
            var query = "SELECT FirstName,LastName from 383121 where FirstName like '%" + searchTerm + "%'"; //" OR LastName like '%" + searchTerm + "%'";
            var uri = 'http://ft2json.appspot.com/q?sql=' + encodeURIComponent(query);

            //console.log('searching ...', uri);
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
                if (logger.isDebug) {
                    logger.debug('xhr timed out');
                }

               autocomplete.suggestions = [];
            };
            xhr.onerror = function(e) {
                if (logger.isDebug) {
                    logger.debug('xhr errored out', e);
                }
                autocomplete.suggestions = [];
            };

        }
    },

    prepareForDraw: {
        value: function() {
            this.states = "California";
            prettyPrint();
        }
    },

    handleUpdateAction: {
        value: function(event) {
            if (logger.isDebug) {
                logger.debug('data: ', this);
            }
            this.json = JSON.stringify({
                state: this.states,
                members: this.members
            });
        }
    },

    logger: {
        value: null
    }
});
