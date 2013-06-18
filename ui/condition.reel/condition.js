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
 @class Condition
 @extends Component
 */

exports.Condition = Component.specialize( /** @lends Condition# */ {

/**
    The Condition component does not have an HTML template, so this value is set to false.
    @type {Property}
    @default {Boolean} false
*/
    hasTemplate: {
        value: false
    },
/**
  @private
*/
    _condition: {
        value: true
    },

    _contents: {
        value: null
    },

    constructor: {
        value: function Condition() {
            this.super();
        }
    },

/**
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
            // If it is being deserialized element might not been set yet
            if (!this.isDeserializing) {
                this._updateDomContent(value);
            }
        },
        get: function() {
            return this._condition;
        }
    },

    _updateDomContent: {
        value: function(value) {
            if (this.removalStrategy === "remove") {
                if (value) {
                    this.domContent = this._contents;
                } else {
                    this._contents = this.domContent;
                    this.domContent = null;
                }
            }
        }
    },

    deserializedFromTemplate: {
        value: function() {
            // update the DOM if the condition is false because we're preventing
            // changes at deserialization time.
            if (!this._condition) {
                this._updateDomContent(this._condition);
            }
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
            var contents;

            if (this._removalStrategy === value) {
                return;
            }
            if (value === "hide" && !this.isDeserializing) {
                contents = this.domContent;
                this.domContent = this._contents;
                this._contents = contents;
            }
            this._removalStrategy = value;
            this.needsDraw = true;
        }
    },

    /**
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
