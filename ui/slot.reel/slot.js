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
 @class module:"montage/ui/slot.reel".Slot
 @extends module:montage/ui/component.Component
 */
exports.Slot = Montage.create(Component, /** @lends module:"montage/ui/slot.reel".Slot# */ {

    hasTemplate: {
        enumerable: false,
        value: false
    },

    didCreate: {
        value: function() {
            this.content = null;
        }
    },

/**
        Description TODO
        @type {Property}
        @default null
    */
    delegate: {
        value: null
    },

    _content: {
        value: null
    },

    prepareForDraw:{
        value:function () {
            this.element.classList.add("montage-Slot");
        }
    },

    /**
        Description TODO
        @type {Function}
        @default null
    */
    content: {
        get: function() {
            return this._content;
        },
        set: function(value) {
            var element;
            if (value && typeof value.needsDraw !== "undefined") {
                // If the incoming content was a component; make sure it has an element before we say it needs to draw
                if (!value.element) {
                    element = document.createElement("div");
                    element.id = "appendDiv"; // TODO: This should be uniquely generated

                    if (this.delegate && typeof this.delegate.slotElementForComponent === "function") {
                        element = this.delegate.slotElementForComponent(this, value, element);
                    }
                } else {
                    element = value.element;
                }
                // The child component will need to draw; this may trigger a draw for the slot itself
                Object.getPropertyDescriptor(Component, "domContent").set.call(this, element);
                value.setElementWithParentComponent(element, this);
                value.needsDraw = true;
            } else {
                Object.getPropertyDescriptor(Component, "domContent").set.call(this, value);
            }
            this._content = value;
            this.needsDraw = true;
        }
    },

/**
        Description TODO
        @type {Function}
        @default null
    */
    contentDidChange: {
        value: function(newContent, oldContent) {
            if (this.delegate && typeof this.delegate.slotDidSwitchContent === "function") {
                this.delegate.slotDidSwitchContent(this, newContent, (newContent ? newContent.controller : null), oldContent, (oldContent ? oldContent.controller : null));
            }
        }
    }
});
