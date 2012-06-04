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
var Montage = require("montage").Montage;

var AppState = exports.AppState = Montage.create(Montage, {

    zip: {
        value: null,
        enumerable: true,
        serializable: true
    },
    
    _getHash: {
        value: function(location) {
            var hash = location.hash;
            if(hash && hash.length > 0 && hash.indexOf('#!/') == 0) {
                hash = hash.substring(hash.indexOf('#')+3);
            }
            return hash;
        }
    },
    
    // Delegate methods to manage Application State
    getUrlFromState: {
        value: function() {
            console.log('return URL for current State');
            return {
                url: "./" + this.zip,
                title: 'Weather Forecast for ' + this.zip
            };
        }
    },

    updateStateFromUrl: {
        value: function(location, savedState) {
            console.log('updating AppState from URL');
            if(savedState) {
                this.zip = state.zip;
            } else {
                // if pushState is not used
                var hash = this._getHash(location);
                if(hash) {
                    this.zip = hash;
                }
            }
            
        }
    }
});
