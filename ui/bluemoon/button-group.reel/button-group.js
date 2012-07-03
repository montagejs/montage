/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/bluemoon/button-group.reel"
    @requires montage/core/core
    @requires "ui/component-group.reel"
*/
var Montage = require("montage").Montage,
    ComponentGroup = require("ui/component-group.reel").ComponentGroup;

/**
 @class module:"montage/ui/bluemoon/button-group.reel".ButtonGroup
 @classdesc A group of buttons, displayed "pill" style.
 @extends module:montage/ui/component.Component
 */
var ButtonGroup = exports.ButtonGroup = Montage.create(ComponentGroup, /** @lends module:"montage/ui/bluemoon/button-group.reel".ButtonGroup */ {
/**
    Description TODO
    @type {Boolean}
    @default true
*/
    hasTemplate: {
        value: true
    },

/**
  Description TODO
  @private
*/
    _iconic: {
        value: false
    },

    /**
     Sets wether or not to hide button text for buttons with icons.
     @type {Function}
     @default {Boolean} false
     */
    iconic: {
        get: function() {
            return this._iconic;
        },
        set: function(value) {
            if (this._iconic !== value) {
                this._iconic = value;
                this.needsDraw = true;
            }
        }
    },

/**
    Description TODO
    @function
    */
    prepareForDraw: {
        value: function() {
            this.element.classList.add("montage-ButtonGroup");
        }
    },

/**
    Description TODO
    @function
    */
    draw: {
        value: function() {
            if (this._iconic) {
                this.element.classList.add("iconic");
            } else {
                this.element.classList.remove("iconic");
            }
        }
    }
});
