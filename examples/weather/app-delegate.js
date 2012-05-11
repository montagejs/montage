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

var AppDelegate = exports.AppDelegate = Montage.create(Montage, {
    
    // Utility methods to deal with URL
    _getHash: {
        value: function() {
            var hash = window.location.hash;
            if(hash && hash.length > 0 && hash.indexOf('#') == 0) {
                hash = hash.substring(hash.indexOf('#')+1);
            }
            return hash;
        }
    },

    // Delegate methods to manage Application State
    getUrlFromState: {
        value: function(state) {
            return {
                hash: '#' + state.zip
            };
        }
    },

    getStateFromUrl: {
        value: function(location) {
            return {
                zip: this._getHash(location)
            };
        }
    }
});
