/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module "montage/ui/input-radio.reel"
    @requires montage/ui/component
    @requires montage/ui/check-input
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    CheckInput = require("ui/check-input").CheckInput;
/**
 * Wraps the a &lt;input type="radio"> element with binding support for the element's standard attributes.
   @class module:"montage/ui/input-radio.reel".InputRadio
   @extends module:montage/check-input.CheckInput
 */
var InputRadio = exports.InputRadio = Montage.create(CheckInput, {
    _fakeCheck: {
        enumerable: false,
        value: function() {
            var changeEvent;
            // NOTE: this may be BAD, modifying the element outside of
            // the draw loop, but it's what a click/touch would
            // actually have done

            if (!this._element.checked) {
                this._element.checked = true;
                changeEvent = document.createEvent("HTMLEvents");
                changeEvent.initEvent("change", true, true);
                this._element.dispatchEvent(changeEvent);
            }
        }
    },

    _checkedSyncedWithInputField: {
        enumerable: false,
        value: false
    },

    _checked: {
        enumerable: false,
        value: null
    },

/**
    Specifies if the InputRadio is in its checked state or not.
    @type {boolean}
    @default false
*/
    checked: {
        get: function() {
            // If we haven't synced with the input field then our value is
            // more up to date than the element and so we don't get it from the
            // element. If we have synced then the user could have changed
            // the focus to another radio button, so we *do* retrieve it from
            // the element.
            if (this._checkedSyncedWithInputField === true) {
                this._checked = this._element.checked;
            }

            return this._checked;
        },
        set: function(value, fromInput) {
            this._checked = value;
            if (fromInput) {
                this._valueSyncedWithInputField = true;
            } else {
                this._valueSyncedWithInputField = false;
                this.needsDraw = true;
            }

            if(this._checked === true) {
                if(this.name && this.name !== null) {
                    // dispatch an event to all other radiobuttons with the same name
                    var anEvent = document.createEvent("CustomEvent");
                    anEvent.initCustomEvent("checked", true, true, {
                        name: this.name
                    });
                    InputRadio.dispatchEvent(anEvent);
                    InputRadio.addEventListener('checked', this);
                }
            }
        }
    },


    handleChecked:{
        value: function(evt) {
            // if we receive this event, it means that some other radiobutton with the same name
            // has been checked. So, mark this as unchecked.
            if(this.name === evt.detail.name) {
                this.checked = false;
                InputRadio.removeEventListener('checked', this);
            }
        }
    },

    draw: {
        value: function() {
            if (!this._valueSyncedWithInputField) {
                this._element.checked = this._checked;
            }

            // Call super
            Object.getPrototypeOf(InputRadio).draw.call(this);
        }
    }
});
InputRadio.addAttributes(/** @lends module:"montage/ui/input-radio.reel".InputRadio */ {

/**
    Specifies whether the radio button should be focused as soon as the page is loaded.
    @type {boolean}
    @default false
*/
    autofocus: {value: false, dataType: 'boolean'},

/**
    When true, the radio button is disabled to user input and "disabled" is added to the element's CSS class list, allowing you to style the disabled control.
    @type {boolean}
    @default false
*/
    disabled: {value: false, dataType: 'boolean'},

/**
    Specifies if the radio button is checked or not.
    @type {boolean}
    @default false
*/
    checked: {value: false, dataType: 'boolean'},

/**
    The value of the id attribute on the form with which to associate the radio button element.
    @type string}
    @default null
*/
    form: null,

/**
    The name associated with the radio button's element.
    @type {string}
    @default null
*/
    name: null,

/**
    Specifies whether or not the user can edit the radio button.
    @type {boolean}
    @default false
*/
    readonly: {value: false, dataType: 'boolean'},

/**
    Advisory information for the element, rendered as the element's tooltip.
    @type {string},
    @default null
*/
    title: null,
    /*
    "On getting, if the element has a value attribute, it must return that
    attribute's value; otherwise, it must return the string "on". On setting,
    it must set the element's value attribute to the new value."
    http://www.w3.org/TR/html5/common-input-element-attributes.html#dom-input-value-default-on
    */
/**
    The value associated with the element.
    @type {string}
    @default "on"
*/
    value: {value: 'on'}
});
