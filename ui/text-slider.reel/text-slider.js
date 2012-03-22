/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    PressComposer = require("ui/composer/press-composer").PressComposer;

var TextSlider = exports.TextSlider = Montage.create(Component, {

    // Properties

    converter: {
        enumerable: false,
        value: null
    },

    _value: {
        enumerable: false,
        value: 0
    },
    value: {
        get: function() {
            return this._value;
        },
        set: function(value) {
            if (this._minValue && value < this._minValue) {
                value = this._minValue;
            } else if (this._maxValue && value > this._maxValue) {
                value = this._maxValue;
            }

            if (this._value !== value) {
                this._value = value;
                this.needsDraw = true;
            }
        }
    },
    _minValue: {
        enumerable: false,
        value: null
    },
    minValue: {
        get: function() {
            return this._minValue;
        },
        set: function(value) {
            if (this._minValue !== value) {
                this._minValue = value;

                this.value = this._value;

                this.needsDraw = true;
            }
        }
    },
    _maxValue: {
        enumerable: false,
        value: null
    },
    maxValue: {
        get: function() {
            return this._maxValue;
        },
        set: function(value) {
            if (this._maxValue !== value) {
                this._maxValue = value;

                this.value = this._value;

                this.needsDraw = true;
            }
        }
    },

    stepSize: {
        enumerable: false,
        value: 1
    },

    _units: {
        enumerable: false,
        value: null
    },
    units: {
        get: function() {
            return this._units;
        },
        set: function(value) {
            if (this._units !== value) {
                this._units = value;
                this.needsDraw = true;
            }
        }
    },

    // private

    _input: {
        enumerable: false,
        value: null
    },
    _unitsLabel: {
        enumerable: false,
        value: null
    },
    _valueLabel: {
        enumerable: false,
        value: null
    },

    _pressComposer: {
        enumerable: false,
        value: null
    },
    _translateComposer: {
        enumerable: false,
        value: null
    },
    // For the translate composer to work
    _range: {
        depends: ["maxValue", "minValue"],
        get: function() {
            return  ( this._maxValue || 1000 ) - ( this._minValue || 0 );
        }
    },

    // draw

    prepareForActivationEvents: {
        value: function() {
            this._input.addEventListener("blur", this, false);
            this._pressComposer.addEventListener("pressStart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);

            console.log(this._translateComposer);
            this._translateComposer.addEventListener("translateStart", this, false);
        }
    },


    // handlers

    surrenderPointer: {
        value: function(pointer, component) {
            // if the value is being changed don't allow anything to take it
            // TODO check what happens when the translate composer takes the
            // pointer
            console.log("text-slider surrenderPointer");
            //return false;
        }
    },

    handlePressStart: {
        value: function(event) {
            console.log("handlePressStart", event);
        }
    },

    handleTranslate: {
        value: function(event) {
            console.log(event.translateY);
        }
    }

});