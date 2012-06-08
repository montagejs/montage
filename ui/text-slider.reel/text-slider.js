/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports */

/**
    @module "montage/ui/text-slider.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires montage/ui/composer/press-composer
 */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    PressComposer = require("ui/composer/press-composer").PressComposer;

/**
    <p>Provides a way for users to quickly and easily manipulate numeric values.
    It takes the form of a numeric value with a dotted underline, optionally
    followed by a unit.

    <p>When the user clicks and drags on the numeric value
    it increases when dragged up or right, and decreases when dragged down or
    left. If the user holds Control or Shift while dragging the value will
    change by a smaller or larger amount respectively.</p>

    <p>If the user clicks without dragging then the component enters "edit mode"
    and turns into a textfield where the user can directly edit the value. If
    user presses the Up or Down arrows in edit mode the value will increase or
    decrease respectively. If the user holds Control or Shift while pressing an
    arrow the value will change by a smaller or larger amount respectively.</p>

    @class module:"montage/ui/text-slider.reel".TextSlider
    @extends module:montage/ui/component.Component
 */
var TextSlider = exports.TextSlider = Montage.create(Component, /** @lends module:"montage/ui/text-slider.reel".TextSlider# */ {

    // Properties

    _converter: {
        enumerable: false,
        value: null
    },
    /**
    A converter that converts from a numeric value to the display value, for
    example to convert to hexadecimal. You may also want to use a converter
    that returns <code>value.toFixed(<i>n</i>)</code> to prevent precision errors from
    being displayed to the user.
    @type {object}
    @default null
    */
    converter: {
        serializable: true,
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
    /**
    The value of the TextSlider.
    @type {Number}
    @default 0
    */
    value: {
        serializable: true,
        get: function() {
            return this._value;
        },
        set: function(value) {
            if (isNaN(value = parseFloat(value))) {
                return false;
            }

            // != null also checking for undefined
            if (this._minValue != null && value < this._minValue) {
                value = this._minValue;
            } else if (this._maxValue != null && value > this._maxValue) {
                value = this._maxValue;
            }

            if (this._value !== value) {
                this._value = value;
                this.needsDraw = true;
            }
        }
    },

    /**
    The value of the TextSlider converted using {@link converter} for display.
    Setting this will call <code>revert</code> on the converter and set
    {@link value}.
    @type {String}
    @default "0"
    */
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
    /**
    The minimum value the TextSlider can take. If set to <code>null</code> there
    is no minimum.
    @type {number|null}
    @default null
    */
    minValue: {
        serializable: true,
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
    /**
    The maximum value the TextSlider can take. If set to <code>null</code> there
    is no maximum.
    @type {number|null}
    @default null
    */
    maxValue: {
        serializable: true,
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

    /**
    The small amount to increase/decrease the value by. Used when the user
    holds the Control key and drags or presses the Up arrow in input mode.
    @type {Number}
    @default 0.1
    */
    smallStepSize: {
        serializable: true,
        enumerable: false,
        value: 0.1
    },
    /**
    The amount to increase/decrease the value by. Used per pixel when the user
    drags the TextSlider or presses the Up arrow in input mode.
    @type {Number}
    @default 1
    */
    stepSize: {
        serializable: true,
        enumerable: false,
        value: 1
    },
    /**
    The large amount to increase/decrease the value by. Used when the user
    holds the Shift key and drags or presses the Up arrow in input mode.
    @type {Number}
    @default 10
    */
    largeStepSize: {
        serializable: true,
        enumerable: false,
        value: 10
    },

    _unit: {
        enumerable: false,
        value: null
    },
    /**
    The unit the value is in. This will be appended to the {@link convertedValue}
    for display.
    @type {String|null}
    @default null
    */
    unit: {
        serializable: true,
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
        serializable: true,
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

    _isEditing: {
        enumerable: false,
        value: null
    },
    /**
        Whether the TextSlider is currently being edited as a textbox
        @type {Boolean}
        @default false
    */
    isEditing: {
        get: function() {
            return this._isEditing;
        },
        set: function(value) {
            if (this._isEditing !== value) {
                this._isEditing = value;
                this.needsDraw = true;
            }
        }
    },

    // private

    _inputElement: {
        serializable: true,
        enumerable: false,
        value: null
    },

    _pressComposer: {
        serializable: true,
        enumerable: false,
        value: null
    },
    _translateComposer: {
        serializable: true,
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

    didCreate: {
        value: function() {
            this.handlePress = this.handleFocus;
            this.handleClick = this.handleFocus;
        }
    },

    // draw

    prepareForActivationEvents: {
        value: function() {
            this._element.addEventListener("click", this, false);
        }
    },

    prepareForDraw: {
        value: function() {
            this._element.addEventListener("focus", this, false);
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
                // When _element gets focus we focus the input. Because of this
                // shift+tab stops working, so prevent _element getting
                // focus while editing
                this._element.tabIndex = -1;
            } else {
                this._element.classList.remove("montage-text-slider-editing");
                this._inputElement.blur();
                this._element.tabIndex = 0;
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

    // handlePress and handleClick are set to equal handleFocus in didCreate
    // handlePress: edit on touch
    // handleClick: edit when parent <label> element is clicked/touched
    // handleFocus: edit when tabbed to
    handleFocus: {
        value: function(event) {
            if (!this._isEditing) {
                this.isEditing = true;
            }
        }
    },
    // stop editing when blurred
    handleBlur: {
        value: function(event) {
            if (this._isEditing) {
                this.convertedValue = this._inputElement.value;
                this.isEditing = false;
            }
        }
    },

    handleKeydown: {
        value: function(event) {
            if (event.target === this._inputElement) {
                var value;
                if (event.keyCode === 38) {
                    // up
                    this.convertedValue = this._inputElement.value;
                    value = Math.round(((event.shiftKey) ? this.largeStepSize : (event.ctrlKey) ? this.smallStepSize : this.stepSize) / this.smallStepSize) * this.smallStepSize;
                    this.value += value;
                    this.needsDraw = true;
                } else if (event.keyCode === 40) {
                    // down
                    this.convertedValue = this._inputElement.value;
                    value = Math.round(((event.shiftKey) ? this.largeStepSize : (event.ctrlKey) ? this.smallStepSize : this.stepSize) / this.smallStepSize) * this.smallStepSize;
                    this.value -= value;
                    this.needsDraw = true;
                } else if (event.keyCode === 13) {
                    // enter
                    this.convertedValue = this._inputElement.value;
                    this.isEditing = false;
                } else if (event.keyCode === 27) {
                    // esc
                    this.isEditing = false;
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
