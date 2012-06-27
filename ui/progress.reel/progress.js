/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    @module "montage/ui/bluemoon/progress.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeProgress = require("ui/native/progress.reel").Progress;
/**
    @class module:montage/ui/progress.Progress
    @extends module:montage/ui/component.Component
*/
exports.Progress = Montage.create(NativeProgress,/** @lends module:"montage/ui/bluemoon/progress.reel".Progress# */ {

    hasTemplate: {value: true},

/**
  Description TODO
  @private
*/
    _barElement: {
        enumerable: false,
        serializable: true,
        value: null
    },
/**
  Description TODO
  @private
*/
    _value: {
        enumerable: false,
        serializable: true,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default {Number} 0
    */
    value: {
        serializable: true,
        get: function() {
            return this._value;
        },
        set: function(val) {
            if(val !== this._value) {
                this._value = String.isString(val) ? parseInt(val, 10) : val;

                if(this._max && (this._value > this._max)) {
                    this._value = this._max;
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
    _max: {
        enumerable: false,
        serializable: true,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default {Number} 100
    */
    max: {
        serializable: true,
        get: function() {
            return this._max;
        },
        set: function(val) {
            if(val !== this._max) {
                this._max = String.isString(val) ? parseInt(val, 10) : val;
                if(this._max <= 0) {
                    this._max = 1; // Prevent divide by zero errors
                }
                this.needsDraw = true;
            }
        }
    },

    didCreate: {
        value: function() {

            if(NativeProgress.didCreate) {
                NativeProgress.didCreate.call(this);
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
            var ratio = this._value / this._max;
            // constrain to interval [0, 1]
            ratio = Math.min(Math.max(ratio, 0), 1);
            // map into [0, 100]
            var percentage = ratio * 100;
            this._barElement.style.width = percentage + '%';
        }
    }
});
