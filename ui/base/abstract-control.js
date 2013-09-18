/*global require, exports, document, Error*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    Dict = require("collections/dict");

/**
 * @class AbstractControl
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
     * example to toggle the complete class: "detail.get('selectedItem')" : { "<-" : "@repetition.objectAtCurrentIteration"}
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
    }

});

// Standard <input> tag attributes - http://www.w3.org/TR/html5/the-input-element.html#the-input-element
AbstractControl.addAttributes({
    accept: null,
    alt: null,
    autocomplete: null,
    autofocus: {dataType: "boolean"},
    contenteditable: {dataType: "boolean"},
    disabled: {dataType: 'boolean'},
    form: null,
    formaction: null,
    formenctype: null,
    formmethod: null,
    formnovalidate: {dataType: 'boolean'},
    formtarget: null,
    height: null,
    list: null,
    maxlength: null,
    multiple: {dataType: 'boolean'},
    name: null,
    pattern: null,
    placeholder: null,
    readonly: {dataType: 'boolean'},
    required: {dataType: 'boolean'},
    size: null,
    src: null,
    style: null,
    title: null,
    width: null
    // "type" is not bindable and "value" is handled as a special attribute
});
