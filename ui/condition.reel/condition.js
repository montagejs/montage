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
        }
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
        }
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
