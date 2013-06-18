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
	@module "montage/ui/slot.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;
/**
 @class Slot
 @extends Component
 */
exports.Slot = Component.specialize( /** @lends Slot# */ {

    hasTemplate: {
        enumerable: false,
        value: false
    },

    constructor: {
        value: function Slot() {
            this.super();
            this.content = null;
        }
    },

/**
        @type {Property}
        @default null
    */
    delegate: {
        value: null
    },

    _content: {
        value: null
    },

    enterDocument:{
        value:function (firstTime) {
            if (firstTime) {
                this.element.classList.add("montage-Slot");
            }
        }
    },

    /**
        @type {Function}
        @default null
    */
    content: {
        get: function() {
            return this._content;
        },
        set: function(value) {
            var element,
                content;

            if (value && typeof value.needsDraw !== "undefined") {
                content = this._content;

                if (content && typeof content.needsDraw !== "undefined") {
                    content.detachFromParentComponent();
                }
                // If the incoming content was a component; make sure it has an element before we say it needs to draw
                if (!value.element) {
                    element = document.createElement("div");
                    element.id = "appendDiv"; // TODO: This should be uniquely generated

                    if (this.delegate && typeof this.delegate.slotElementForComponent === "function") {
                        element = this.delegate.slotElementForComponent(this, value, element);
                    }
                    value.element = element;
                } else {
                    element = value.element;
                }
                // The child component will need to draw; this may trigger a draw for the slot itself
                Object.getPropertyDescriptor(Component, "domContent").set.call(this, element);
                this.addChildComponent(value);
                value.needsDraw = true;
            } else {
                Object.getPropertyDescriptor(Component, "domContent").set.call(this, value);
            }
            this._content = value;
            this.needsDraw = true;
        }
    },

/**
        @type {Function}
        @default null
    */
    contentDidChange: {
        value: function(newContent, oldContent) {
            if (this.delegate && typeof this.delegate.slotDidSwitchContent === "function") {
                this.delegate.slotDidSwitchContent(this, newContent, (newContent ? newContent.component : null), oldContent, (oldContent ? oldContent.component : null));
            }
        }
    }
});
