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
    _barEl: {
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
            var percentage = (this._value / this._maximumValue) * 100;
            if(percentage > 100) {
                this._barEl.style.width = "100%";
            } else {
                this._barEl.style.width = percentage + '%';
            }

            if(this._scrollingChanged) {
                if(this._scrolling) {
                    this._barEl.classList.add("scrolling");
                } else {
                    this._barEl.classList.remove("scrolling");
                }
                this._scrollingChanged = false;
            }
        }
    }
});
