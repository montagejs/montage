/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    CheckInput = require("ui/check-input").CheckInput;
/**
 * The Text input
 */
var RadioButton = exports.RadioButton = Montage.create(CheckInput, {
    _checkedSyncedWithInputField: {
        enumerable: false,
        value: false
    },

    _checked: {
        enumerable: false,
        value: null
    },
    checked: {
        get: function() {
            // If we haven't synced with the input field then our value is
            // more up to date than the element and so we don't get it from the
            // element. If we have synced then the user could have changed
            // the focus to another radio button, so we *do* retrieve it from
            // the element.
            if (this._checkedSyncedWithInputField === true) {
                this._checked = this._element.checked;
            }

            return this._checked;
        },
        set: function(value, fromInput) {
            this._checked = value;
            if (fromInput) {
                this._valueSyncedWithInputField = true;
            } else {
                this._valueSyncedWithInputField = false;
                this.needsDraw = true;
            }
            
            if(this._checked === true) {
                if(this.name && this.name !== null) {
                    // dispatch an event to all other radiobuttons with the same name
                    var anEvent = document.createEvent("CustomEvent");
                    anEvent.initCustomEvent("checked", true, true, {
                        name: this.name
                    });
                    anEvent.type = "checked";
                    RadioButton.dispatchEvent(anEvent);
                    RadioButton.addEventListener('checked', this);
                }                
            }                        
        }
    },
    
    
    handleChecked:{
        value: function(evt) {
            // if we receive this event, it means that some other radiobutton with the same name
            // has been checked. So, mark this as unchecked. 
            if(this.name === evt.detail.name) {
                this.checked = false;
                RadioButton.removeEventListener('checked', this);
            }            
        }
    },

    draw: {
        value: function() {
            if (!this._valueSyncedWithInputField) {
                this._element.checked = this._checked;
            }

            // Call super
            var fn = Object.getPrototypeOf(RadioButton).draw.call(this);
        }
    }
});
RadioButton.addAttributes({
    autofocus: 'off', // on/off
    disabled: {value: false, dataType: 'boolean'},
    checked: {value: false, dataType: 'boolean'},
    form: null,
    name: null,
    readonly: {value: false, dataType: 'boolean'},
    title: null,
    /*
    "On getting, if the element has a value attribute, it must return that
    attribute's value; otherwise, it must return the string "on". On setting,
    it must set the element's value attribute to the new value."
    http://www.w3.org/TR/html5/common-input-element-attributes.html#dom-input-value-default-on
    */
    value: {value: 'on'}
});
