/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/dynamic-text.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
 @class module:"montage/ui/dynamic-text.reel".DynamicText
 @extends module:montage/ui/component.Component
 */
exports.DynamicText = Montage.create(Component, /** @lends module:"montage/ui/dynamic-text.reel".DynamicText# */ {

    hasTemplate: {
        value: false
    },
/**
  Description TODO
  @private
*/
    _value: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    value: {
        get: function() {
            return this._value;
        },
        set: function(value) {
            if (this._value !== value) {
                this.needsDraw = true;
            }
            this._value = value;
        },
        serializable: true
    },
/**
        The Montage converted used to convert or format values displayed by this DynamicText instance.
        @type {Property}
        @default null
    */
    converter: {
        value: null
    },
/**
        The default string value assigned to the DynamicText instance.
        @type {Property}
        @default {String} ""
    */
    defaultValue: {
        value: ""
    },

    /**
     @private
     */
    _valueNode: {
        value: null,
        enumerable: false
    },

    /**
     @private
     */
    _dirty: {
        value: true
    },

    prepareForDraw: {
        value: function() {
        }
    },

    __range: {
        value: null
    },

    _range: {
        get: function() {
            if (this.__range === null) {
                var range = document.createRange();
                range.selectNodeContents(this.element);
                this.__range = range;
            }
            return this.__range;
        }
    },

    allowedElements: {
        value: null
    },

    draw: {
        value: function() {
            // get correct value
            var displayValue = (this.value || 0 === this.value ) ? this._value : this.defaultValue,
                allowedElements, documentFragment, range = this._range, valueNode = this._valueNode;

            if (this.converter) {
                displayValue = this.converter.convert(displayValue);
            }

            //push to DOM
            if(this.allowedElements) {
                allowedElements = this.allowedElements;
                if(this._dirty) {
                    range.deleteContents();
                    // dereference textnode for non html content
                    valueNode = null;
                }
                documentFragment = this.__range.createContextualFragment( displayValue );
                if (allowedElements !== null) {
                    var elements = documentFragment.querySelectorAll("*:not(" + allowedElements.join(",") + ")");
                    if (elements.length=== 0) {
                        range.insertNode(documentFragment);
                    } else {
                        console.log("Some Elements Not Allowed " , elements);
                    }
                }
            } else {
                if(this._dirty) {
                    range.deleteContents();
                    this._valueNode = valueNode = document.createTextNode("");
                    range.insertNode(valueNode);
                }
                valueNode.data = displayValue;
            }
        }
    }

});
