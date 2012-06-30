/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    logger = require("montage/core/logger").logger("tokenField-example"),
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

var tags = [
'science', 'programming', 'javascript', 'java', 'user experience', 'UX', 'UI', 'user interface design',
'travel', 'arts', 'design', 'education', 'entertainment', 'fasion', 'movies', 'tv shows', 'gadgets',
'apple', 'social', 'network', 'technology', 'tools', 'home', 'interiors', 'search', 'politics', 'news',
'business', 'companies', 'startups', 'silicon valley', 'bay area', 'biking', 'tennis', 'united states', 'USA'
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


exports.TokenFieldExample = Montage.create(Component, {

    json: {value: null},
    states: {value: null},
    members: {value: null},
    tags: {value: null,
    info: {value: null},

    logger: {
        value: null
    },

    _cachedStates: {value: null},

    prepareForDraw: {
        value: function() {
            this.states = [states[0], states[3], states[5]];
            prettyPrint();
        }
    },

    stateShouldGetSuggestions: {
        value: function(tokenField, searchTerm) {
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
            tokenField.suggestions = results;
        }
    },

    // Return the represented object for the specified stringValue
    stateGetRepresentedObject: {
        value: function(stringValue) {
            if(stringValue) {
                stringValue = stringValue.trim().toLowerCase();
                var i, len = states.length;
                for(i=0; i<len; i++) {
                    if(states[i].name.toLowerCase() === stringValue) {
                        return states[i];
                    }
                }
            }
            return null;
        }
    },

    membersShouldGetSuggestions: {
        value: function(tokenField, searchTerm) {
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
                       result = data;
                   }
                   tokenField.suggestions = result;

               } catch(e) {
                   tokenField.suggestions = [];
               }

            };
            xhr.ontimeout = function() {
                if (logger.isDebug) {
                    logger.debug('xhr timed out');
                }

               tokenField.suggestions = [];
            };
            xhr.onerror = function(e) {
                if (logger.isDebug) {
                    logger.debug('xhr errored out', e);
                }
                tokenField.suggestions = [];
            };

        }
    },

    tagsShouldGetSuggestions: {
        value: function(tokenField, searchTerm) {
            var results = [];
            if(searchTerm) {
                var term = searchTerm.toLowerCase();
                results = tags.filter(function(item) {
                    return (item.toLowerCase().indexOf(term) >= 0);
                });
            }
            tokenField.suggestions = results;
        }
    },

    handleUpdateAction: {
        value: function(event) {
            if (logger.isDebug) {
                logger.debug('data: ', this);
            }
            this.json = JSON.stringify({
                state: this.states,
                members: this.members,
                tags: this.tags
            });
        }
    }
});
