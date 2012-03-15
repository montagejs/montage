/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module montage/ui/condition.reel
    @requires montage/core/core
    @requires montage/ui/component
    @requires "montage/ui/slot.reel"
    @requires montage/core/logger
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    Slot = require("ui/slot.reel").Slot,
    logger = require("core/logger").logger("condition");
/**
 @class module:"montage/ui/condition.reel".Condition
 @extends module:montage/ui/component.Component
 */

exports.Condition = Montage.create(Component, /** @lends module:"montage/ui/condition.reel".Condition# */ {

/**
    The Condition component does not have an HTML template, so this value is set to false.
    @type {Property}
    @default {Boolean} false
*/
    hasTemplate: {
        enumerable: false,
        value: false
    },
/**
  Description TODO
  @private
*/
    _condition: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    condition: {
        enumerable: false,
        set: function(value) {

            if (value === this._condition) {
                return;
            }

            this._condition = value;
            this.needsDraw = true;
            if (this.removalStrategy === "remove") {
                if (value) {
                    this._slot.content = this.content;
                } else {
                    this._slot.content = null;
                }
            }
        },
        get: function() {
            return this._condition;
        }
    },
/**
  Description TODO
  @private
*/
    _content: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    content: {
        enumerable: false,
        get: function() {
            return this._content;
        },
        set: function(value) {
            if (this._content === value) {
                return;
            }

            this._content = value;
            this.needsDraw = true;

            if (this.removalStrategy === "remove") {
                if (this.condition) {
                    this._slot.content = value;
                }
            } else {
                this._slot.content = value;
            }

        }
    },

    /**
     @private
     */
    _removalStrategy:{
        value: "remove",
        enumerable:false
    },

    // TODO should this strategy be part of another class?
    // TODO expose the options as an exported enum
    removalStrategy:{
        get:function () {
            return this._removalStrategy;
        },
        set:function (value) {
            if (this._removalStrategy === value) {
                return;
            }
            if (value === "hide" || this.condition) {
                // was remove OR was hide
                this._slot.content = this.content;
            }
            this._removalStrategy = value;
        }
    },


    didCreate:{
        value:function () {
            this._slot = Slot.create();
        }
    },


    /**
    Description TODO
    @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {
            var i, childList, childElement;
            if (!this.content) {
                this.content = document.createElement("div");
                childList = Array.prototype.slice.call(this._element.childNodes, 0);
                for (i = 0; (childElement = childList[i]); i++) {
                    childElement.parentNode.removeChild(childElement);
                    this.content.appendChild(childElement);
                }
            }

            var slotRoot = document.createElement("div");
            this.element.appendChild(slotRoot);

            this._slot.element = slotRoot;
        }
    },
    /**
    Description TODO
    @function
    */
    draw: {
        enumerable: false,
        value: function() {

            if (this.condition) {
                this.element.classList.remove("montage-invisible");
            } else {
                this.element.classList.add("montage-invisible");
            }

        }
    }

});
