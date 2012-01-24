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
RadioButton.addProperties({
    autofocus: 'off', // on/off
    disabled: {value: false, dataType: 'boolean'},
    checked: {value: false, dataType: 'boolean'},
    form: null,
    formenctype: null,
    name: null,
    placeholder: null,
    readonly: {value: false, dataType: 'boolean'},
    required: {value: false, dataType: 'boolean'},
    src: null,
    title: null,
    value: {value: 'on'}
});
