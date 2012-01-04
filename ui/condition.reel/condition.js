/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
        }
    },

    // TODO should this strategy be part of another class?
    // TODO expose the options as an exported enum
    removalStrategy: {
        enumerable: false,
        value: "remove"
    },

    /**
    Description TODO
    @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {

            if (!this.content) {
                this.content = document.createElement("div");

                var conditionContentRange = document.createRange();
                conditionContentRange.selectNodeContents(this._element);

                // TODO not wrap the range if it is a range of a single element
                // we want to only deal with single elements when appending and removing;
                // this keeps us from having to keep track of the range or risk losing
                // a reference to the elements when they're extracted
                conditionContentRange.surroundContents(this.content);
            }

            var slotRoot = document.createElement("div");
            this.element.appendChild(slotRoot);

            this.content.parentNode.removeChild(this.content);
            slotRoot.appendChild(this.content);

            this._slot = Slot.create();
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
                this._slot.content = this.content;
                this.element.classList.remove("montage-invisible");
            } else {
                if ("hide" === this.removalStrategy) {
                    this.element.classList.add("montage-invisible");
                } else {
                    this._slot.content = null;
                }
            }

        }
    }

});
