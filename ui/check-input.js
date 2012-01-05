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
    _valueSyncedWithInputField: {
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
            var el = this.element;

            if (!this._valueSyncedWithInputField) {
                el.checked = this._checked;
            }
            
            var fn = Object.getPrototypeOf(CheckInput).draw;
            fn.call(this);
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
        }
    }
});

