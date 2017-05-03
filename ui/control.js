/**
    @module montage/ui/control
*/

var Component = require("ui/component").Component,
    deprecate = require("core/deprecate"),
    Map = require("collections/map");

/**
    Base component for all native components, such as RadioButton and Checkbox.
    @class module:montage/ui/control.Control
    @extends module:montage/ui/component.Component
 */
var Control = exports.Control = Component.specialize(/** @lends module:montage/ui/control.Control# */ {

    constructor: {
        value: function Control () {
            this.defineBindings({
                // classList management
                "classList.has('montage--disabled')": {
                    "<-": "disabled"
                },
                "classList.has('montage--active')": {
                    "<-": "active"
                }
            });
        }
    },

    /**
     * Dispatched when the button is activated through a mouse click, finger
     * tap, or when focused and the spacebar is pressed.
     *
     * @event AbstractControl#action
     * @type {Event}
     * @property {Map} detail - pass custom data in this property
     */

    /**
     * @function
     * @fires AbstractControl#action
     */
    dispatchActionEvent: {
        value: function () {
            return this.dispatchEvent(this.createActionEvent());
        }
    },

    /**
     * A promise that indicates an action event triggered an asynchronous task.
     * The control will stop listening to user input until actionCompletionPromise
     * is resoved or rejected, and uses CSS classes to represent the Promise resolution
     * @property {Promise} value
     * @default undefined
     */
    actionCompletionPromise: {
        value: undefined
    },

    /**
     * @private
     * @property {Map} value
     * @default null
     */
    _detail: {
        value: null
    },

    /**
     * The data property of the action event.
     *
     * Example to toggle the complete class: `"detail.get('selectedItem')" : {
     * "<-" : "@repetition:iteration.object"}`
     *
     * @returns {Map}
     */
    detail: {
        get: function () {
            if (this._detail == null) {
                this._detail = new Map();
            }
            return this._detail;
        }
    },

    /**
     * Overrides {@link Component#createActionEvent}
     * by adding {@link AbstractControl#detail} custom data
     *
     * @function
     * @returns {AbstractControl#action}
     */
    createActionEvent: {
        value: function () {
            var actionEvent = document.createEvent("CustomEvent"),
                eventDetail;

            eventDetail = this._detail;
            actionEvent.initCustomEvent("action", true, true, eventDetail);
            return actionEvent;
        }
    },

    hasTemplate: {
        get: function() {
            return !this.hasStandardElement;
        }
    },

    standardElementTagName: {
        value: "INPUT"
    },

    _hasStandardElement: {
        value:null
    },

    hasStandardElement: {
        get: function () {
            return typeof this._hasStandardElement === "boolean" ?  this._hasStandardElement : (this._hasStandardElement = this.element.tagName === this.standardElementTagName);
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this.element.addEventListener("focus", this, false);
            this.element.addEventListener('blur', this, false);
        }
    },

    /**
     * This property is meant to be used as a way to flag when a component is being interacted with, either through mouse or touch event. false by default,
     * specialized components like controls would set it to true when being interacted with.
     * @type {boolean}
     * @default false
     */
    active: {
        value: false
    },

    enabled: {
        get: function () {
            return !this.disabled;
        },
        set: function (value) {
            if (typeof value === "boolean") {
                this.disabled = !value;
            }
        }
    },

    _focusBlur: {
        value: undefined
    },

    focus: {
        value: function () {
            this._focusBlur = 1;
            this.needsDraw = true;

            if (!this.preparedForActivationEvents) {
                this._prepareForActivationEvents();
            }
        }
    },

    blur: {
        value: function() {
            this._focusBlur = 0;
            this.needsDraw = true;
        }
    },

    /*  In some cases elements can't receive focus()
        http://stackoverflow.com/questions/1599660/which-html-elements-can-receive-focus
        http://snook.ca/archives/accessibility_and_usability/elements_focusable_with_tabindex
        https://davidwalsh.name/tabindex-focus
        http://www.456bereastreet.com/archive/201302/making_elements_keyboard_focusable_and_clickable/
        Look at tab-index
    */
    hasFocus: {
        enumerable: false,
        value: false
    },

    _elementNeedsTabIndexRegex: {
        value: /INPUT|TEXTAREA|A|SELECT|BUTTON|LABEL/
    },

    _elementNeedsTabIndex: {
        value: function () {
            return this.element.tagName.match(this._elementNeedsTabIndexRegex) === null;
        }
    },

    draw: {
        value: function () {
        if (this._elementNeedsTabIndex()) {
            if (this._preventFocus) {
                this.element.removeAttribute("tabindex");
            } else {
                this.element.setAttribute("tabindex", "0");
            }
        }

          if (this._focusBlur === 1) {
                this._element.focus();
            } else if (this._focusBlur === 0 || !this.drawsFocusOnPointerActivation) {
                this._element.blur();
            }
            this._focusBlur = void 0;
            // this.drawValue();
        }
    },

    acceptsActiveTarget: {
        get: function () {
            //Should the be done in focus instead?
            var shouldBeginEditing = this.callDelegateMethod("shouldBeginEditing", this);
            return (shouldBeginEditing !== false);
        }
    },

    willBecomeActiveTarget: {
        value: function (event) {
            this.hasFocus = true;
            this.callDelegateMethod("didBeginEditing", this);
        }
    },

    surrendersActiveTarget: {
        value: function (event) {
            var shouldEnd = this.callDelegateMethod("shouldEndEditing", this);

            if (shouldEnd === false) {
                return false;
            } else {
                this.hasFocus = false;
                //Check if that's not redundant with "didEndEditing" triggered from handleBlur
                this.callDelegateMethod("didEndEditing", this);
            }

            return true;
        }
    },

    _preventFocus: {
        enumerable: false,
        value: false
    },

/**
    Specifies whether the button should receive focus or not.
    @type {boolean}
    @default false
    @event longpress @benoit: no events here?
*/
    preventFocus: {
        get: function () {
            return this._preventFocus;
        },
        set: function (value) {
            this._preventFocus = !!value;
            this.needsDraw = true;
        }
    },

    drawsFocusOnPointerActivation : {
        value: false
    },

    /**
     * Description TODO
     * @function
     * @param {Event Handler} event TODO
     */
    handleFocus: {
        enumerable: false,
        value: function (event) {
            this.hasFocus = true;
            this.drawsFocusOnPointerActivation = true;
        }
    },

    handleBlur: {
        enumerable: false,
        value: function (event) {
            this.hasFocus = false;
            this.drawsFocusOnPointerActivation = false;
            this.callDelegateMethod("didEndEditing", this);
            //This create an issue in textfield, to investigate
            this.dispatchActionEvent();
        }
    },

    _value: {
        value: null
    },

    /**
     * This property is meant to return the value of a control's element. specialized controls can override this to access different DOM properties if needed
     * @type {String}
     */
    elementValue: {
        get: function () {
            return this.element.value;
        }
    },
    /*
    The value associated with the checkbox. Per the WC3 specification, if the element has a <code>value</code> attribute then the value of that attribute's value is returned; otherwise, it returns "on".

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
    @default "on"
    */
    value: {
        get: function () {
            return this._value;
        },
        set: function (value, fromInput) {

            if (value !== this._value) {
                var shouldAcceptValue
                if (!this.delegate ||  (shouldAcceptValue = this.callDelegateMethod("shouldAcceptValue", this, value) ) === undefined ? true : shouldAcceptValue ){
                    // console.log("_setValue past first step value is ",value);

                    if (this.converter) {
                        var convertedValue;
                        try {
                            //Where is the matching convert?
                            convertedValue = this.converter.revert(value);
                            this.error = null;
                            this._value = convertedValue;
                        } catch (e) {
                            // unable to convert - maybe error
                            this._value = value;
                            //FIXME: we don't handle required field.
                            this.error = value !== "" && value !== void 0 && value !== null ? e : null;
                        }
                    } else {
                        this._value = value;
                        this.error = null;
                    }

                    this.callDelegateMethod("didChange", this);

                    this._elementAttributeValues["value"] = value;

                    this.needsDraw = true;
                }
            }
        }
    },

    /**
        A reference to a Converter object whose <code>revert()</code> function is invoked when a new value is assigned to the TextInput object's <code>value</code> property. The revert() function attempts to transform the newly assigned value into a "typed" data property. For instance, a DateInput component could assign a DateConverter object to this property to convert a user-supplied date string into a standard date format.
        @type {Converter}
        @default null
        @see {@link module:montage/core/converter.Converter}
    */
    converter:{
        value: null
    },

    _error: {
        value: null
    },



/* Look at
    https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation
    https://developer.mozilla.org/en-US/docs/Web/API/ValidityState
    https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Forms/Data_form_validation
    http://stackoverflow.com/questions/16634471/how-can-i-get-the-html5-validity-state-of-an-input-text-box
    http://html5index.org/DOM%20-%20ValidityState.html
*/

/**
    If an error is thrown by the converter object during a new value assignment, this property is set to <code>true</code>, and schedules a new draw cycle so the the UI can be updated to indicate the error state. the <code>montage--invalidText</code> CSS class is assigned to the component's DOM element during the next draw cycle.
    @type {boolean}
    @default false
*/
    error: {
        get: function () {
            return this._error;
        },
        set: function (v) {
            this._error = v;
            this.errorMessage = this._error ? this._error.message : null;
            this.needsDraw = true;
        }
    },

    _errorMessage: {value: null},

    /**
     * The message to display when the component is in an error state.
     * @type {string}
     * @default null
     * @todo: @benoit: we should maybe take a look at ValidityState
     * https://developer.mozilla.org/en/docs/Web/API/ValidityState
     * https://msdn.microsoft.com/en-us/library/windows/apps/hh441292.aspx
     */
    errorMessage: {
        get: function () {
            return this._errorMessage;
        },
        set: function (v) {
            this._errorMessage = v;
        }
    },

    // // set value from user input
    // /**
    //   @private
    // */
    takeValueFromElement: {
        value: function() {
            this.value = this.elementValue;
            // Object.getPropertyDescriptor(this, "value").set.call(this, this.element.value, true);
        }
    },
    /**
        Returns a Boolean value indicating whether the control dispatched its action event continuously when value changes.

        @type {}
        @default false
        * @returns {boolean}
        @see {@link module:montage/core/converter.Converter}
    */
    isContinuous: {
        value: false
    }

});

//http://www.w3.org/TR/html5/elements.html#global-attributes
Control.addAttributes( /** @lends module:montage/ui/control.Control# */ {
    /**
        Specifies if the control should receive focus when the document loads. Because Montage components are loaded asynchronously after the document has loaded, setting this property has no effect on the element's focus state.
        @type {boolean}
        @default false
    */
        autofocus: {value: false, dataType: 'boolean'},

    /**
        Specifies if the control is disabled.
        @type {boolean}
        @default false
    */
        disabled: {value: false, dataType: 'boolean'},

    /**
        The value of the id attribute of the form with which to associate the element.
        @type {string}
        @default null
    */
        form: null,

    /**
        The name part of the name/value pair associated with this element for the purposes of form submission.
        @type {string}
        @default null
    */
        name: null,

    /**
        Specifies if this control is readonly.
        @type {boolean}
        @default false
    */
        readonly: {value: false, dataType: 'boolean'}

});
