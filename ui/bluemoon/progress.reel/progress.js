/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
	@module "montage/ui/bluemoon/progress.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;
/**
    @class module:"montage/ui/bluemoon/progress.reel".Progress
    @extends module:montage/ui/component.Component
*/
exports.Progress = Montage.create(Component,/** @lends module:"montage/ui/bluemoon/progress.reel".Progress# */ {
/**
  Description TODO
  @private
*/
    _barElement: {
        value: null
    },
/**
  Description TODO
  @private
*/
    _value: {
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
                if(this._value > this._max) {
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
        value: 100
    },
/**
        Description TODO
        @type {Function}
        @default {Number} 100
    */
    max: {
        get: function() {
            return this._max;
        },
        set: function(val) {
            if(val !== this._max) {
                this._max = val;
                if(this._max <= 0) {
                    this._max = 1; // Prevent divide by zero errors
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
        value: true
    },
/**
  Description TODO
  @private
*/
    _scrolling: {
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
            var ratio = this._value / this._max;
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
