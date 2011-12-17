/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("ui/component").Component;
/**
 * Common base class for all Form UI controls
    @extends module:montage/ui/component.Component
 */
var FormField = exports.FormField = Montage.create(Component, /** @lends module:montage/ui/editable-text.FormField# */ {

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
    _value: {
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
    value: {
        enumerable: true,
        serializable: true,
        get: function() {
            return this._value;
        },
        set: function(value, fromInput) {
            this._value = value;
            if(fromInput) {
                this._valueSyncedWithInputField = true;
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
    _setValue: {
        value: function() {
            var newValue = this.element.value;
            if (newValue && newValue.length > 0 && this.converter) {
                var convertedValue;
                try {
                    convertedValue = this.converter.revert(newValue);
                    if (this.error) {
                        this.error = null;
                    }
                    // kishore: this is required bcos we need to pass the 2nd parameter to the setter
                    Object.getPropertyDescriptor(this, "value").set.call(this, convertedValue, true);

                } catch(e) {
                    // unable to convert - maybe error
                    this.error = e;
                    //this._valueSyncedWithInputField = false;
                }
            } else {
                Object.getPropertyDescriptor(this, "value").set.call(this, newValue, true);
            }
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
    _disabled: {
        enumerable: true,
        value: false
    },
/**
        Description TODO
        @type {Function}
        @default {Boolean} false
    */
    disabled: {
        get: function() {
            return this._disabled;
        },
        set: function(value) {
            this._disabled = value;
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


     /**
       Description TODO
       @private
     */
     _setElementValue: {
         value: function(v) {
             this.element.value = v;
         }
     },


    // Montage Lifecycle Callbacks
    
    deserializedFromTemplate: {
        value: function() {
            var attrs = this.element.attributes || [];
            var i=0, len = attrs.length, name, value;
            
            // keep a map of existing map for easy lookup
            for(i=0; i< len; i++) {
                if(!this._attrsMap) {
                    this._attrsMap = {};
                }
                name = attrs[i].name;
                value = attrs[i].value;
                
                this._attrsMap[name] = value;
                
                if(typeof this[name] !== 'undefined' && value) {
                    this[name] = value;
                }
                
            }
            
            console.log('FormField component after: ');
            console.log(this);
            
        }
    },
    
    /**
    Description TODO
    @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {
            var el = this.element;
            el.value = this._inputValue;
            el.addEventListener("focus", this);
            el.addEventListener('input', this);
            el.addEventListener('change', this);
            el.addEventListener('blur', this);
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
                this._setElementValue(this.converter ? this.converter.convert(this._value) : this._value);
            }

            if (this._disabled) {
                t.setAttribute('disabled');
            } else {
                t.removeAttribute('disabled');
            }

            if (this.error) {
                t.classList.add('montage-text-invalid');
                t.title = this.error.message || '';
            } else {
                t.classList.remove("montage-text-invalid");
                t.title = '';
            }
            
            // set all other attributes that are part of the subclasses
            if(typeof this._attrs !== 'undefined') {
                var i, len = this._attrs.length, attr;
                for(i=0; i<len; i++) {
                    attr = this._attrs[i];
                    if(typeof this[attr] !== 'undefined' && this[attr] !== null) {
                        this.element[attr] = this[attr];
                    }
                }
            }

            //this._drawSpecific();
        }
    },
/**
    Description TODO
    @function
    */
    didDraw: {
        enumerable: false,
        value: function() {
            if (this._hasFocus && this._value != null) {
                var length = this._value.toString().length;
                this.element.setSelectionRange(length, length);
            }
            this._valueSyncedWithInputField = true;
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
                    this._setValue();
                }
            } else {
                this._setValue();
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
            this._setValue();
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
