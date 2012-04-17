/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    PressComposer = require("ui/composer/press-composer").PressComposer;

exports.Token = Montage.create(Component, {

    text: {value: null},

    value: {
        get: function() {
            return this._value;
        },
        set: function(aValue) {
            if(aValue) {
               this._value = aValue;
            }
            if(this._value) {
                if(this.textPropertyPath) {
                    this.text = this.value[this.textPropertyPath];
                } else {
                    this.text = this.value;
                }
            }
        }
    },

    textPropertyPath: {value: null},

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

    removeSelf: {
        value: function() {
            this.tokensController.removeObjects(this.value);
        }
    },

   handleMouseup: {
       value: function(event) {
           this.removeSelf();
       }
   },
   handleTouchup: {
       value: function(event) {
          this.removeSelf();
      }
  }

});
