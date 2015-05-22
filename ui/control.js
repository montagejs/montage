/**
    @module montage/ui/control
*/

var Component = require("ui/component").Component,
    Dict = require("collections/dict");


/**
    Base component for all native components, such as RadioButton and Checkbox.
    @class module:montage/ui/control.Control
    @extends module:montage/ui/component.Component
 */
var Control = exports.Control = Component.specialize(/** @lends module:montage/ui/control.Control# */ {
    constructor: {
        value: function AbstractCheckbox() {

            this.defineBindings({
                // classList management
                "classList.has('montage--disabled')": {
                    "<-": "!enabled"
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
     * @property {Dict} detail - pass custom data in this property
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
     * @private
     * @property {Dict} value
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
     * @returns {Dict}
     */
    detail: {
        get: function () {
            if (this._detail == null) {
                this._detail = new Dict();
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
        value: false
    },

    willPrepareForDraw: {
        value: function() {
        }
    },
    
    standardElementTagName: {
        value: "INPUT"
    },
    
    hasStandardElement: {
        get: function() {
            return (this.element.tagName === this.standardElementTagName);
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
            return !this._disabled;
        },
        set: function (value) {
            this.disabled = !value;
        }
    }
    
});

//http://www.w3.org/TR/html5/elements.html#global-attributes
Control.addAttributes( /** @lends module:montage/ui/control.Control# */ {
    /**
        Specifies if the checkbox control should receive focus when the document loads. Because Montage components are loaded asynchronously after the document has loaded, setting this property has no effect on the element's focus state.
        @type {boolean}
        @default false
    */
        autofocus: {value: false, dataType: 'boolean'},

    /**
        Specifies if the checkbox control is disabled.
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
        readonly: {value: false, dataType: 'boolean'},
    
    /*
    The value associated with the checkbox. Per the WC3 specification, if the element has a <code>value</code> attribute then the value of that attribute's value is returned; otherwise, it returns "on".
    @type {string}
    @default "on"
    */
        value: {value: 'on'}
        

});
