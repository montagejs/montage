/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
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
        value: false
    },
/**
  Description TODO
  @private
*/
    _condition: {
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    condition: {
        set: function(value) {

            if (value === this._condition) {
                return;
            }

            this._condition = value;
            this.needsDraw = true;
            // If it is being deserialized originalContent has not been populated yet
            if (this.removalStrategy === "remove"  && !this.isDeserializing) {
                if (value) {
                    this.domContent = this.originalContent;
                } else {
                    this.domContent = null;
                }
            }
        },
        get: function() {
            return this._condition;
        },
        serializable: true
    },

    /**
     @private
     */
    _removalStrategy:{
        value: "remove"
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
            if (value === "hide" && !this.isDeserializing) {
                this.domContent = this.originalContent;
            }
            this._removalStrategy = value;
            this.needsDraw = true;
        },
        serializable: true
    },

    prepareForDraw: {
        value: function() {
            if (this.removalStrategy === "remove" && !this.condition) {
                this.domContent = null;
            }
        }
    },

    /**
    Description TODO
    @function
    */
    draw: {
        value: function() {

            if (this.condition) {
                this.element.classList.remove("montage-invisible");
            } else {
                this.element.classList.add("montage-invisible");
            }

        }
    }

});
