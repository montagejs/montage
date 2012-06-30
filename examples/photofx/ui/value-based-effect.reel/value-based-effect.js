/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var undoManager = require("montage/core/undo-manager").defaultUndoManager;

exports.ValueBasedEffect = Montage.create(Component, {

    name: {
        value: null
    },

    enabled: {
        value: false
    },

    defaultValue: {
        value: null
    },

    _value: {value: 0},
    value: {
        value: 0
    },

    _originalSliderValue: {
        value: null
    },


    handleValueSliderMontage_range_interaction_start: {
        value: function() {
            this._originalSliderValue = this.sliderValue;
        }
    },

    handleValueSliderMontage_range_interaction_end: {
        value: function() {
            this._commitSliderValue();
            this._originalSliderValue = null;
        }
    },


    _commitSliderValue: {
        value: function(value) {
            var undoneValue = this._originalSliderValue ? this._originalSliderValue : this.sliderValue;
            if (this.sliderValue !== this._originalSliderValue) {
                undoManager.add(this.name.toLowerCase() + " change", this._commitSliderValue, this, undoneValue);
            }

            if (typeof value !== "undefined") {
                this.sliderValue = value;
            }
        }
    },

    sliderValue: {
        dependencies: ["value"],
        get: function() {
            return this.value;
        },
        set: function(value) {
            if (value === this._value) {
                return;
            }

            this.value = value;

        }
    },

    minValue: {
        value: 0
    },

    maxValue: {
        value: 100
    },

    reset: {
        value: function() {
            this.value = this.defaultValue;
        }
    }

});

var Converter = require("montage/core/converter/converter").Converter;

exports.ResetAvailableConverter = Montage.create(Converter, {

    defaultValue: {
        value: null
    },

    convert: {
        value: function(value) {
            if (null == this.defaultValue) {
                return false;
            } else {
                return (value !== this.defaultValue);
            }
        }
    }

});
