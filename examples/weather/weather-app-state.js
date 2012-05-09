/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 Provides common conversion, validation, and formatting functions for different types of values.
 @module montage/core/converter/converter
 @requires montage/core/core
 */
var Montage = require("montage").Montage,
AppState = require("montage/core/app-state").AppState;

var WeatherAppState = exports.WeatherAppState = Montage.create(AppState, {
    
    init: {
        value: function() {
            AppState.init.call(this);
        }
    },

    // API
    _zip: {value: null},
    zip: {
        get: function() {
            return this._zip;
        },
        set: function(value) {
            if(value && this._zip != value) {
                this._zip = value;
                this.updateURL(this._getURL());
            }
        }
    },
    
    // return the URL contextualized with the current state
    _getURL: {
        value: function() {
            return {
                hash: '#' + this.zip 
            };
        }
    },
    
    urlDidChange: {
        value: function(location) {
            // update State from the url
            this.zip = this.getHash(location);
        }
    }
    
});

WeatherAppState.init();

