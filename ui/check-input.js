/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeControl = require("ui/native-control").NativeControl;

var CheckInput = exports.CheckInput =  Montage.create(NativeControl, {



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

    /*
    deserializedFromTemplate: {
        value: function() {
            // TODO: check that this is the correct way to do this
            this.checked = this.element.checked;
        }
    },
    */

    // Callbacks
    /**
        Description TODO
        @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {
            this.element.addEventListener('change', this);
        }
    },

    /**
        Description TODO
        @function
    */
    draw: {
        enumerable: false,
        value: function() {
            this.element.checked = this._checked;
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
            this._dispatchActionEvent();
        }
    }
});
