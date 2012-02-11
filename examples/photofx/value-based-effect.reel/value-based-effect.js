/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.ValueBasedEffect = Montage.create(Component, {

    enabled: {
        enumerable: false,
        value: false
    },

    defaultValue: {
        enumerable: false,
        value: null
    },

    _value: {value: 0},
    value: {
        enumerable: false,
        value: 0
    },

    _originalSliderValue: {
        enumerable: false,
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
        enumerable: false,
        value: function(value) {
            var undoneValue = this._originalSliderValue ? this._originalSliderValue : this.sliderValue;
            if (this.sliderValue !== this._originalSliderValue) {
                document.application.undoManager.add(this.name.toLowerCase() + " change", this._commitSliderValue, this, undoneValue);
            }

            if (typeof value !== "undefined") {
                this.sliderValue = value;
            }
        }
    },

    sliderValue: {
        dependencies: ["value"],
        enumerable: false,
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
        enumerable: false,
        value: 0
    },

    maxValue: {
        enumerable: false,
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
