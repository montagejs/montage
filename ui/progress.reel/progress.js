/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/progress.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;
/**
    @class module:montage/ui/progress.Progress
    @extends module:montage/ui/component.Component
*/
exports.Progress = Montage.create(Component,/** @lends module:"montage/ui/progress.reel".Progress# */ {
/**
  Description TODO
  @private
*/
    _barElement: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _value: {
        enumerable: false,
        value: 0
    },
/**
        Description TODO
        @type {Function}
        @default {Number} 0
    */
    value: {
        get: function() {
            return this._value;
        },
        set: function(val) {
            if(val !== this._value) {
                this._value = val;
                if(this._value > this._maximumValue) {
                    this._value = this._maximumValue;
                }
                if(this._value < 0) {
                    this._value = 0;
                }
                this.needsDraw = true;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _maximumValue: {
        enumerable: false,
        value: 100
    },
/**
        Description TODO
        @type {Function}
        @default {Number} 100
    */
    maximumValue: {
        get: function() {
            return this._maximumValue;
        },
        set: function(val) {
            if(val !== this._maximumValue) {
                this._maximumValue = val;
                if(this._maximumValue <= 0) {
                    this._maximumValue = 1; // Prevent divide by zero errors
                }
                this.needsDraw = true;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _scrollingChanged: {
        enumerable: false,
        value: true
    },
/**
  Description TODO
  @private
*/
    _scrolling: {
        enumerable: false,
        value: false
    },
/**
        Description TODO
        @type {Function}
        @default {Boolean} false
    */
    scrolling: {
        get: function() {
            return this._scrolling;
        },
        set: function(value) {
            if(this._scrolling !== value) {
                this._scrollingChanged = true;
                this._scrolling = value;
                this.needsDraw = true;
            }
        }
    },
/**
    Description TODO
    @function
    */
    draw: {
        enumerable: false,
        value: function() {
            var ratio = this._value / this._maximumValue;
            // constrain to interval [0, 1]
            ratio = Math.min(Math.max(ratio, 0), 1);
            // map into [0, 100]
            var percentage = ratio * 100;
            this._barElement.style.width = percentage + '%';
            if(this._scrollingChanged) {
                if(this._scrolling) {
                    this._barElement.classList.add("scrolling");
                } else {
                    this._barElement.classList.remove("scrolling");
                }
                this._scrollingChanged = false;
            }
        }
    }
});
