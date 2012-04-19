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

    _converter: {
        enumerable: false,
        value: null
    },
    converter: {
        get: function() {
            return this._converter;
        },
        set: function(value) {
            if (this._converter !== value) {
                this._converter = value;
                this.needsDraw = true;
            }
        }
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
            if (isNaN(value = parseFloat(value))) {
                return false;
            }

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

    convertedValue: {
        dependencies: ["value", "converter"],
        get: function() {
            // TODO catch errors from conversion?
            return (this._converter) ? this._converter.convert(this._value) : this._value;
        },
        set: function(value) {
            if (this._converter) {
                this.value = this._converter.revert(value);
            } else {
                this.value = value;
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

    smallStepSize: {
        enumerable: false,
        value: 0.1
    },
    stepSize: {
        enumerable: false,
        value: 1
    },
    largeStepSize: {
        enumerable: false,
        value: 10
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
    _isEditing: {
        enumerable: false,
        value: false
    },

    // draw

    prepareForDraw: {
        value: function() {
            this._inputElement.addEventListener("blur", this, false);
            this._inputElement.addEventListener("keydown", this, false);
        }
    },

    draw: {
        value: function() {
            if (this._isEditing) {
                this._element.classList.add("montage-text-slider-editing");
                this._inputElement.value = this.convertedValue + ((this._unit) ? " " + this._unit : "");
                // Replace this with just focus when merged
                this._inputElement.focus();
            } else {
                this._element.classList.remove("montage-text-slider-editing");
                this._inputElement.blur();
            }

            if (this._direction === "horizontal") {
                document.body.style.cursor = "ew-resize";
            } else if (this._direction === "vertical") {
                document.body.style.cursor = "ns-resize";
            } else {
                document.body.style.cursor = "auto";
            }

        }
    },

    // handlers

    surrenderPointer: {
        value: function(pointer, component) {
            // Don't allow the value to be dragged when we're being edited.
            return !this._isEditing;
        }
    },

    handlePress: {
        value: function(event) {
            if (!this._isEditing) {
                this._isEditing = true;
                this.needsDraw = true;
            }
        }
    },

    handleBlur: {
        value: function(event) {
            if (this._isEditing) {
                this._isEditing = false;
                this.convertedValue = this._inputElement.value;
                this.needsDraw = true;
            }
        }
    },
    handleKeydown: {
        value: function(event) {
            if (event.target === this._inputElement) {
                if (event.keyCode === 38) {
                    // up
                    this.convertedValue = this._inputElement.value;
                    var value = Math.round(((event.shiftKey) ? this.largeStepSize : (event.ctrlKey) ? this.smallStepSize : this.stepSize) / this.smallStepSize) * this.smallStepSize;
                    this.value += value;
                    this.needsDraw = true;
                } else if (event.keyCode === 40) {
                    // down
                    this.convertedValue = this._inputElement.value;
                    this.value -= (event.shiftKey) ? this.largeStepSize : (event.shiftKey) ? this.smallStepSize : this.stepSize;
                    this.needsDraw = true;
                } else if (event.keyCode === 13) {
                    // enter
                    this._isEditing = false;
                    this.convertedValue = this._inputElement.value;
                    this.needsDraw = true;
                } else if (event.keyCode === 27) {
                    // esc
                    this._isEditing = false;
                    this.needsDraw = true;
                }
            } else {
                if (event.shiftKey || event.keyCode === 16) {
                    this._translateComposer.pointerSpeedMultiplier = this.largeStepSize / this.stepSize;
                } else if (event.ctrlKey || event.keyCode === 17) {
                    this._translateComposer.pointerSpeedMultiplier = this.smallStepSize / this.stepSize;
                }
            }
        }
    },
    handleKeyup: {
        value: function(event) {
            if (event.shiftKey || event.keyCode === 16) {
                this._translateComposer.pointerSpeedMultiplier = this.stepSize;
            } else if (event.ctrlKey || event.keyCode === 17) {
                this._translateComposer.pointerSpeedMultiplier = this.stepSize;
            }
        }
    },

    handleTranslateStart: {
        value: function(event) {
            this._direction = null;

            this._startX = this._value;
            this._startY = this._value;

            // reset translate composer ready for more translation
            this._translateComposer.translateX = this._value;
            this._translateComposer.translateY = this._value;

            document.addEventListener("keydown", this, false);
            document.addEventListener("keyup", this, false);
        }
    },
    handleTranslate: {
        value: function(event) {
            if (this._direction === "vertical") {
                this.value = event.translateY;
            } else if (this._direction === "horizontal") {
                this.value = event.translateX;
            } else {
                var value,
                    deltaX = Math.abs(event.translateX - this._startX),
                    deltaY = Math.abs(event.translateY - this._startY);

                if (deltaY > deltaX) {
                    value = event.translateY;
                    if (deltaY > 20) {
                        this._direction = "vertical";
                    }
                } else {
                    value = event.translateX;
                    if (deltaX > 20) {
                        this._direction = "horizontal";
                    }
                }
                this.value = value;
            }
        }
    },
    handleTranslateEnd: {
        value: function(event) {
            this._direction = null;
            this.needsDraw = true;
            document.removeEventListener("keydown", this, false);
            document.removeEventListener("keyup", this, false);
        }
    }

});
