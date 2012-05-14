/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestController = require("support/test-controller").TestController;

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


var Test = exports.TestController = Montage.create(TestController, {

    tokenField1: {
        value: null
    },
    tokenField2: {
        value: null
    },
    
    states: {value: null},
    tags: {value: null},

    prepareForDraw: {
        value: function() {
            this.states = [states[0], states[3], states[5]];
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
    }
});
exports.theTest = Test.create();
