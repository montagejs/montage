/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    PressComposer = require("ui/composer/press-composer").PressComposer;

exports.Token = Montage.create(Component, {

    value: {value: null},

    tokensController: {value: null},

    _pressComposer: {
        enumberable: false,
        value: null
    },

    deleteEl: {value: null},

    didCreate: {
        value: function() {
            /*
            this._pressComposer = PressComposer.create();
            this.addComposer(this._pressComposer);
            */
        }
    },

    prepareForActivationEvents: {
        value: function() {
            /*
            this._pressComposer.addEventListener("pressStart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);
            */
            if(window.Touch) {
                this.deleteEl.addEventListener('touchup', this);
            } else {
                this.deleteEl.addEventListener('mouseup', this);
            }

        }
    },

    draw: {
        value: function() {

        }
    },

    // Event handling

   handleMouseup: {
       value: function(event) {
           console.log('remove token', this.value);
           this.tokensController.removeObjects(this.value);
       }
   }

});
