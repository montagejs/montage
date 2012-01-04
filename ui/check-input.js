/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeControl = require("ui/native-control").NativeControl;

var CheckInput = exports.CheckInput =  Montage.create(NativeControl, {

    hasTemplate: {
        value: true
    },
/**
  Description TODO
  @private
*/
    _hasFocus: {
        enumerable: false,
        value: false
    },
/**
  Description TODO
  @private
*/
    _checked: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _valueSyncedWithInputField: {
        enumerable: false,
        value: false
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    checked: {
        enumerable: true,
        serializable: true,
        get: function() {
            return (this._checked !== null) ? this._checked : this.element.checked;
        },
        set: function(checked, fromInput) {
            this._checked = checked;       
            if(fromInput) {
                //this._valueSyncedWithInputField = true;
                this.needsDraw = true;
            } else {
                this._valueSyncedWithInputField = false;
                this.needsDraw = true;
            }
        }
    },

    // set value from user input
    /**
      @private
    */
    _setChecked: {
        value: function() {
            var newValue = this.element.checked;
            Object.getPropertyDescriptor(this, "checked").set.call(this, newValue, true);
        }
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    converter:{
        value: null
    },
/**
  Description TODO
  @private
*/
    _error: {
        value: false
    },
 /**
        Description TODO
        @type {Function}
        @default {Boolean} false
    */
    error: {
        get: function() {
            return this._error;
        },
        set: function(v) {
            this._error = v;
            this.needsDraw = true;
        }
    },
/**
  Description TODO
  @private
*/
    _readOnly: {
        enumerable: true,
        value: false
    },
/**
        Description TODO
        @type {Function}
        @default {Boolean} false
    */
    readOnly: {
        get: function() {
            return this._readOnly;
        },
        set: function(value) {
            this._readOnly = value;
            this.needsDraw = true;
        }
    },
/**
  Description TODO
  @private
*/
    _updateOnInput: {
        value: true
    },

    // switch to turn off auto update upon keypress overriding the Converter flag
/**
        Description TODO
        @type {Function}
        @default {Boolean} true
    */
    updateOnInput: {
        get: function() {
            return !!this._updateOnInput;
        },
        set: function(v) {
            this._updateOnInput = v;
        }
    },

    deserializedFromTemplate: {
        value: function() {
            // TODO: check that this is the correct way to do this
            this.checked = this.element.checked;
        }
    },

    // Callbacks
    /**
    Description TODO
    @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {
            var el = this.element;
            el.addEventListener("focus", this);
            el.addEventListener('input', this);
            el.addEventListener('change', this);
            el.addEventListener('blur', this);
        }
    },
/**
  Description TODO
  @private
*/
    _setElementChecked: {
        value: function(v) {
            this.element.checked = v;
        }
    },
/**
    Description TODO
    @function
    */
    draw: {
        enumerable: false,
        value: function() {
            
            var t = this.element;

            if (!this._valueSyncedWithInputField) {
                this._setElementChecked(this.converter ? this.converter.convert(this._checked) : this._checked);
            }

            if (this._readOnly) {
                t.setAttribute('readonly');
            } else {
                t.removeAttribute('readonly');
            }

            if (this.error) {
                t.classList.add('montage-text-invalid');
                t.title = this.error.message || '';
            } else {
                t.classList.remove("montage-text-invalid");
                t.title = '';
            }
            
            var fn = Object.getPrototypeOf(CheckInput).draw;
            fn.call(this);

        }
    },

    // Event handlers
/**
    Description TODO
    @function
    */
    handleInput: {
        enumerable: false,
        value: function() {
            if (this.converter) {
                if (this.converter.allowPartialConversion === true && this.updateOnInput === true) {
                    this._setChecked();
                }
            } else {
                this._setChecked();
            }
        }
    },
/**
    Description TODO
    @function
    @param {Event Handler} event TODO
    */
    handleChange: {
        enumerable: false,
        value: function(event) {
            this._setChecked();
            this._hasFocus = false;
        }
    },
/**
    Description TODO
    @function
    @param {Event Handler} event TODO
    */
    handleBlur: {
        enumerable: false,
        value: function(event) {
            this._hasFocus = false;
        }
    },
/**
    Description TODO
    @function
    @param {Event Handler} event TODO
    */
    handleFocus: {
        enumerable: false,
        value: function(event) {
            this._hasFocus = true;
        }
    }

});

