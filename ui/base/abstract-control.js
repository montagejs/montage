/*global require, exports, document, Error*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    Dict = require("collections/dict");

/**
 * @class AbstractControl
 * @classdesc A basis for common behavior of control components.
 * @extends Component
 */
var AbstractControl = exports.AbstractControl = Component.specialize( /** @lends AbstractControl# */ {

    dispatchActionEvent: {
        value: function() {
            return this.dispatchEvent(this.createActionEvent());
        }
    },

    _detail: {
        value: null
    },

    /**
     * The data property of the action event.
     *
     * Example to toggle the complete class: `"detail.get('selectedItem')" : {
     * "<-" : "@repetition.objectAtCurrentIteration"}`
     * @type {Dict}
     * @default null
     */
    detail: {
        get: function() {
            if (this._detail == null) {
                this._detail = new Dict();
            }
            return this._detail;
        }
    },

    createActionEvent: {
        value: function() {
            var actionEvent = document.createEvent("CustomEvent"),
                eventDetail;

            eventDetail = this._detail;
            actionEvent.initCustomEvent("action", true, true, eventDetail);
            return actionEvent;
        }
    },

    _value: {
        enumerable: false,
        value: null
    },

    _valueSyncedWithInputField: {
        enumerable: false,
        value: false
    },

    /**
        The "typed" data value associated with the input element. When this
        property is set, if the component's <code>converter</code> property is
        non-null then its <code>revert()</code> method is invoked, passing it
        the newly assigned value. The <code>revert()</code> function is
        responsible for validating and converting the user-supplied value to
        its typed format. For example, in the case of a DateInput component
        (which extends TextInput) a user enters a string for the date (for
        example, "10-12-2005"). A <code>DateConverter</code> object is assigned
        to the component's <code>converter</code> property.

        If the comopnent doesn't specify a converter object then the raw value
        is assigned to <code>value</code>.

        @type {string}
        @default null
    */
    value: {
        get: function() {
            return this._value;
        },
        set: function(value, fromInput) {

            if(value !== this._value) {
                if(this.converter) {
                    var convertedValue;
                    try {
                        convertedValue = this.converter.revert(value.toString());
                        this.error = null;
                        this._value = convertedValue;
                    } catch(e) {
                        // unable to convert - maybe error
                        // refuse to set the value: this._value = value;
                        this.error = e;
                    }
                } else {
                    this._value = value;
                }

                if (fromInput) {
                    this._valueSyncedWithInputField = true;
                } else {
                    this._valueSyncedWithInputField = false;
                    this.needsDraw = true;
                }
                this.element.value = this._value;
            }
        }
    },

    checkValidity: {
        value: function() {
            if (this.required) {
                return  this._value !== null && this._value !== undefined && this._value.trim() !== "";
            }
            return true;
        }
    },

    // set value from user input
    /**
      @private
    */
    _setValue: {
        value: function() {
            var newValue = this.element.value;
            Object.getPropertyDescriptor(this, "value").set.call(this, newValue, true);
        }
    },

    /**
        A reference to a Converter object whose <code>revert()</code> function is invoked when a new value is assigned to the TextInput object's <code>value</code> property. The revert() function attempts to transform the newly assigned value into a "typed" data property. For instance, a DateInput component could assign a DateConverter object to this property to convert a user-supplied date string into a standard date format.
        @type {Converter}
        @default null
        @see {@link module:montage/core/converter.Converter}
    */
    converter: {
        value: null
    },

    _error: {
        value: null
    },

    /**
        If an error is thrown by the converter object during a new value assignment, this property is set to <code>true</code>, and schedules a new draw cycle so the the UI can be updated to indicate the error state. the <code>montage--invalidText</code> CSS class is assigned to the component's DOM element during the next draw cycle.
        @type {boolean}
        @default false
    */
    error: {
        get: function() {
            return this._error;
        },
        set: function(v) {
            this._error = v;
            this.errorMessage = this._error ? this._error.message : null;
            this.needsDraw = true;
        }
    },

    _errorMessage: {value: null},

    /**
        The message to display when the component is in an error state.
        @type {string}
        @default null
    */
    errorMessage: {
        get: function() {
            return this._errorMessage;
        },
        set: function(v) {
            this._errorMessage = v;
        }
    }
});

// Subset of <input> tag attributes - http://www.w3.org/TR/html5/the-input-element.html#the-input-element
AbstractControl.addAttributes({
    disabled: {dataType: 'boolean'},
    readonly: {dataType: 'boolean'},
    required: {dataType: 'boolean'}
});
