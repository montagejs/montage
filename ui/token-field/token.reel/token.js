/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

exports.Token = Montage.create(Component, {

    _text: {
        value: null
    },

    text: {
        dependencies: ["value", "textPropertyPath"],
        get: function() {
            var textPropertyPath,
                value,
                text;

            if (this._text == null) {
                this._adHoc = false;
                textPropertyPath = this.textPropertyPath;
                value = this.value;

                if (textPropertyPath != null && value != null) {
                    if (typeof value[textPropertyPath] === 'undefined' && this.allowAdHocValues) {
                        this._adHoc = true;
                        this._text = value;
                    } else {
                        this._text = value[textPropertyPath];
                    }
                } else {
                    this._text = value;
                }
            }

            return this._text;
        }
    },

    allowAdHocValues: {value: null, serializable: true},

    _value: {
        value: null
    },

    value: {
        serializable: true,
        get: function() {
            return this._value;
        },
        set: function(aValue) {
            this._value = aValue;
            this._text = null;
        }
    },

    textPropertyPath: {value: null, serializable: true},

    tokensController: {value: null, serializable: true},

    // private

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

    _deleteEl: {value: null, serializable: true},

    prepareForDraw: {
        value: function() {
            if(window.Touch) {
                this._deleteEl.addEventListener('touchend', this);
            } else {
                this._deleteEl.addEventListener('click', this);
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
            this.tokensController.selectedObjects = [this.value];
            this.tokensController.removeObjectsAtSelectedIndexes();
            this.tokensController.selectedIndexes = [];
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
