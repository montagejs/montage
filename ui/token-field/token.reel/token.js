/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

exports.Token = Montage.create(Component, {

    text: {value: null},

    allowAdHocValues: {value: null},

    value: {
        get: function() {
            return this._value;
        },
        set: function(aValue) {
            this._adHoc = false;
            if(aValue) {
               this._value = aValue;
               if(this.textPropertyPath) {
                   if(typeof aValue[this.textPropertyPath] == 'undefined' && this.allowAdHocValues) {
                       this.text = aValue;
                       this._adHoc = true;
                   } else {
                       this.text = this.value[this.textPropertyPath];
                   }
               } else {
                   this.text = this.value;
               }
            }
        }
    },

    textPropertyPath: {value: null},

    tokensController: {value: null},

    __adHoc: {value: null},
    _adHoc: {
        get: function() {
            return this.__adHoc;
        },
        set: function(value) {
            this.__adHoc = value;
            this.needsDraw = true;
        }
    },

    _pressComposer: {
        enumberable: false,
        value: null
    },

    deleteEl: {value: null},

    prepareForActivationEvents: {
        value: function() {
            if(window.Touch) {
                this.deleteEl.addEventListener('touchend', this);
            } else {
                this.deleteEl.addEventListener('click', this);
            }

        }
    },

    draw: {
        value: function() {
            this.element.classList[this._adHoc ? 'add' : 'remove']('montage-token-adhoc');
        }
    },

    // Event handling

    removeSelf: {
        value: function() {
            this.tokensController.removeObjects(this.value);
        }
    },

   handleClick: {
       value: function(event) {
           this.removeSelf();
       }
   },
   handleTouchend: {
       value: function(event) {
          this.removeSelf();
      }
  }

});
