/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeControl = require("ui/native-control").NativeControl;

var CheckInput = exports.CheckInput =  Montage.create(NativeControl, {

    // Callbacks
    draw: {
        value: function() {
            // Call super
            NativeControl.draw.call(this);
            this._element.setAttribute("aria-checked", this._checked);
        }
    },

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
    @param {Event Handler} event TODO
    */
    handleChange: {
        enumerable: false,
        value: function(event) {
            Object.getPropertyDescriptor(this, "checked").set.call(this,
                this.element.checked, true);
            this._dispatchActionEvent();
        }
    }
});
