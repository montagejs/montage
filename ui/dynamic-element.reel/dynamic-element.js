/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    @module "montage/ui/dynamic-element.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
    The DynamicElement is a general purpose component that aims to expose all the properties of the element as a component.
    @class module:"montage/ui/dynamic-element.reel".DynamicElement
    @extends module:montage/ui/component.Component
*/
exports.DynamicElement = Montage.create(Component, /** @lends module:"montage/ui/dynamic-element.reel".DynamicElement# */ {

    hasTemplate: {
        value: false
    },

    _innerHTML: {
        value: null
    },

    /**
        The innerHTML displayed as the content of the DynamicElement
        @type {Property}
        @default null
    */
    innerHTML: {
        get: function() {
            return this._innerHTML;
        },
        set: function(value) {
            if (this._innerHTML !== value) {
                this._innerHTML = value;
                this.needsDraw = true;
            }
        },
        serializable: true
    },

    /**
        The default html displayed if innerHTML is falsy.
        @type {Property}
        @default {String} ""
    */
    defaultHTML: {
        value: ""
    },

    _allowedTagNames: {
        value: null
    },

    /**
        White list of allowed tags in the innerHTML
        @type {Property}
        @default null
    */
    allowedTagNames: {
        get: function() {
            return this._allowedTagNames;
        },
        set: function(value) {
            if (this._allowedTagNames !== value) {
                this._allowedTagNames = value;
                this.needsDraw = true;
            }
        },
        serializable: true
    },

    _range: {
        value: null
    },

    prepareForDraw: {
        value: function() {
            var range = document.createRange();
            range.selectNodeContents(this.element);
            this._range = range;
        }
    },

    _contentNode: {
        value: null
    },

    draw: {
        value: function() {
            // get correct value
            var displayValue = (this.innerHTML || 0 === this.innerHTML ) ? this.innerHTML : this.defaultHTML,
                content, allowedTagNames = this.allowedTagNames, range = this._range;

            //push to DOM
            if (allowedTagNames !== null) {
                //cleanup
                this._contentNode = null;
                range.deleteContents();
                //test for tag white list
                content = range.createContextualFragment( displayValue );
                var elements = content.querySelectorAll("*:not(" + allowedTagNames.join(",") + ")");
                if (elements.length=== 0) {
                    range.insertNode(content);
                } else {
                    console.warn("Some Elements Not Allowed " , elements);
                }
            } else {
                content = this._contentNode;
                if(content === null) {
                    //cleanup
                    range.deleteContents();
                    this._contentNode = content = document.createTextNode(displayValue);
                    range.insertNode(content);
                } else {
                    content.data = displayValue;
                }
            }
        }
    }

});
