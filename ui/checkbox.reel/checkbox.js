/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    UserInput = require("ui/user-input").UserInput;
/**
 * The Text input
 */
var Checkbox = exports.Checkbox = Montage.create(UserInput, {
	_checked: {
		enumerable: false,
		value: false
	},
	checked: {
		enumerable: true,
        serializable: true,
		get: function() {
			return this._checked;
		},
		set: function(value) {
			console.log(this.element, value);
			this._checked = value;
		}
	},
	
    // set value from user input
    /**
      @private
    */
    _setValue: {
        value: function() {
            var newValue = this.element.checked;
            Object.getPropertyDescriptor(this, "checked").set.call(this, newValue, true);
        }
    },
});

Checkbox.addProperties({
        autofocus: 'off', // on/off
        disabled: {value: 'false', dataType: 'boolean'},
        form: '',
        formenctype: '',
        name: '',
        placeholder: '',
        readonly: {value: 'false', dataType: 'boolean'},
        required: {value: 'false', dataType: 'boolean'},
        src: '',
        title: '',
        value: {value: 'on'}
});