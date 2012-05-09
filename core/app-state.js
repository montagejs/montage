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


var AppState = exports.AppState = Montage.create(Montage, /** @lends module:montage/core/AppState# */ {

    // API
    
    synchUrl: {
        value: true
    },
    
    // URL hashing or pushState
    useHash: {
        value: true
    },
    
    // private
    _synching: {value: false},

    init: {
        value: function() {
            if(this.synchUrl) {
                var self = this;
                
                if(self.urlDidChange && !self.synching) {
                    self.urlDidChange(window.location);
                }
                
                window.onhashchange = function(event) {                    
                    event.preventDefault();     
                                                       
                    if(self.urlDidChange && !self.synching) {
                        self.urlDidChange(window.location);
                    }
                    
                    self._synching = false;
                };
            }
            
        }
    },
    
    updateURL: {
        value: function(newLocation) {
            if(this.synchUrl) {
                this._synching = true;
                if(String.isString(newLocation)) {
                    window.location = newLocation;
                } else {
                    if(newLocation.hash) {
                        window.location.hash = newLocation.hash;
                    } else {

                    }                    
                }                
                
            }
        }
    },
    
    // Utility methods to deal with URL
    getHash: {
        value: function() {
            var hash = window.location.hash;
            if(hash && hash.length > 0 && hash.indexOf('#') == 0) {
                hash = hash.substring(hash.indexOf('#')+1);
            }
            return hash;
        }
    }
    
});

