/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.ProgressExample = Montage.create(Component, {

    _uploadProgress: {value: null},
    uploadProgress: {
        set: function(value) {
            this._uploadProgress = value;
            this.needsDraw = true;
        },
        get: function() {
            return this._uploadProgress;
        },
        serializable: true
    },

    _intervalId: {value: null},

    draw: {
        value: function() {
            console.log('draw progress');
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
                self.uploadProgress = self.uploadProgress + 10;
                if(self.uploadProgress > 100) {
                    self.uploadProgress = 0;
                }
            }, 1000);
        }
    },

    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
    },

    logger: {
        value: null,
        serializable: true
    }

});
