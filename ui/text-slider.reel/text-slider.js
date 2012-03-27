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

    _unit: {
        enumerable: false,
        value: null
    },
    unit: {
        get: function() {
            return this._unit;
        },
        set: function(value) {
            if (this._unit !== value) {
                this._unit = value;
                this.needsDraw = true;
            }
        }
    },

    _units: {
        enumerable: false,
        value: []
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

    _startX: {
        enumerable: false,
        value: null
    },
    _startY: {
        enumerable: false,
        value: null
    },
    _direction: {
        enumerable: false,
        value: null
    },

    // draw


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

    handlePress: {
        value: function(event) {
            console.log("handlePress", event);

        }
    },

    handleTranslateStart: {
        value: function(event) {
            this._direction = null;
            this._startX = event.translateX;
            this._startY = event.translateY;
        }
    },
    handleTranslate: {
        value: function(event) {
            var value,
                deltaX = event.translateX - this._startX,
                deltaY = event.translateY - this._startY;

            if (this._direction === "vertical") {
                this.value = event.translateY - deltaY * 2;
            } else if (this._direction === "horizontal") {
                this.value = event.translateX;
            } else {

                if (Math.abs(deltaY) > Math.abs(deltaX)) {
                    value = event.translateY - deltaY * 2;
                    if (Math.abs(deltaY) > 20) {
                        this._direction = "vertical";
                    }
                } else {
                    value = event.translateX;
                    if (Math.abs(deltaX) > 20) {
                        this._direction = "horizontal";
                    }
                }
                this.value = value;
            }
        }
    },
    handleTranslateEnd: {
        value: function(event) {
            // sync the values for the next change
            this._translateComposer.translateX = this._value;
            this._translateComposer.translateY = this._value;
        }
    }

});