/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.DynamicTextExample = Montage.create(Component, {
    
    _currentTime: {value: null},
    currentTime: {
        set: function(value) {this._currentTime = value; this.needsDraw = true;},
        get: function() {return this._currentTime;}
    },
    
    _intervalId: {value: null},
    
    draw: {
        value: function() {
            console.log('draw DynamicTextExample');
        }
    },
    
    didBecomeInactiveInSlot: {
        value: function() {
            if(this._intervalId) {
                clearInterval(this._intervalId);
                this._intervalId = null;
            }
        }
    },
    
    didBecomeActiveInSlot: {
        value: function() {
            var self = this;
            if(this._intervalId) {
                clearInterval(this._intervalId);
            }
            this._intervalId = setInterval(function() {
                self.currentTime = new Date(Date.now());
            }, 1000);
        }
    }

});
