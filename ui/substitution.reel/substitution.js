/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/substitution.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires montage/ui/slot
    @requires core/logger
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    Slot = require("ui/slot.reel").Slot,
    logger = require("core/logger").logger("substitution");
/**
 @class module:"montage/ui/substitution.reel".Substitution
 */
exports.Substitution = Montage.create(Slot, /** @lends module:"montage/ui/substitution.reel".Substitution# */ {

    hasTemplate: {
        enumerable: false,
        value: false
    },
/**
        Description TODO
        @type {Property}
        @default {}
    */
    switchComponents: {
        enumerable: false,
        serializable: true,
        distinct: true,
        value: {}
    },
/**
  Description TODO
  @private
*/
    _switchValue: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    switchValue: {
        enumerable: false,
        get: function() {
            return this._switchValue;
        },
        set: function(value) {

            if (this._switchValue === value || this._isSwitchingContent) {
                return;
            }

            this._switchValue = value;

            if (this.switchComponents) {
                this.content = this.switchComponents[this.switchValue];
            }
        }
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    transition: {
        enumerable: false,
        value: null
    },
/**
    Description TODO
    @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {

            if (this.switchComponents) {
                this.content = this.switchComponents[this.switchValue];
            }
        }
    }

});
