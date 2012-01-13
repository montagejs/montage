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
var Slot = exports.Slot = Montage.create(Component, /** @lends module:"montage/ui/slot.reel".Slot# */ {

    hasTemplate: {
        enumerable: false,
        value: false
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    delegate: {
        enumerable: false,
        value: null
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
  @private
*/
    _content: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _contentToRemove: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _contentToAppend: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _contentHasChanged: {
        enumerable: false,
        value: true
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

            // if no change or busy drawing a switch, ignore this "new" value
            if ((!!value && this._content === value)|| (!!this._contentToAppend && value === this._contentToAppend) || this._isSwitchingContent) {
                return;
            }

            if (this._contentToAppend) {
                // If we already had some content that was going to be appended, don't bother with it
                // the new value we just received will supercede it
                this._contentToAppend.needsDraw = false;
                this._drawList = [];
            }

            // TODO if given a serialized component or something (a template) we should be able to handle that

            this._contentToAppend = value;

            if (this._contentToAppend && typeof this._contentToAppend.needsDraw !== "undefined") {

                // If the incoming content was a component; make sure it has an element before we say it needs to draw
                if (!this._contentToAppend.element) {
                    var nodeToAppend = document.createElement("div");
                    nodeToAppend.id = "appendDiv";

                    if (this.delegate && typeof this.delegate.slotElementForComponent === "function") {
                        nodeToAppend = this.delegate.slotElementForComponent(this, this._contentToAppend, nodeToAppend);
                    }
                    this._contentToAppend.element = nodeToAppend;
                }

                if (!this._contentToAppend.parentComponent) {
                    this._contentToAppend._cachedParentComponent = this;
                }

                // The child component will need to draw; this may trigger a draw for the slot itself
                this._contentToAppend.needsDraw = true;
            }

            this.needsDraw = true;
            this._contentToRemove = this._content;
            this._contentHasChanged = true;

            return value;
        }
    },
/**
  Description TODO
  @private
*/
    _isSwitchingContent: {
        enumerable: false,
        value: false
    },

    childComponentWillPrepareForDraw: {
        value: function(child) {
            if (child.element.parentElement == null) {
                // by the time a child component lets us know it's about to prepare to draw for the first time
                // we know we need to append its element to our own element.
                // This happens outside of any drawing for better or worse right now.
                this._element.appendChild(child.element);
                this.needsDraw = true;
            }
        }
    },

    _canAppendContent: {
        enumerable: false,
        value: false
    },

    canDraw: {
        value: function() {

            if (this._contentToAppend) {
                if (typeof this._contentToAppend.needsDraw !== "undefined") {
                    this._canAppendContent = this._contentToAppend.canDraw();
                    if (this._canAppendContent) {
                        this.needsDraw = true;
                    }
                } else {
                    this._canAppendContent = true;
                }
            } else {
                // No content to append, but we can render that situation (empty out the slot)
                this._canAppendContent = true;
            }

            // We'll always offer to draw if asked to allow children to draw, but what the slot does when it draws
            // will depend on the _canAppendContent flag determined at this point
            return true;
        }
    },
/**
    Description TODO
    @function
    */
    draw: {
        value: function() {


            if (!this._canAppendContent) {
                return;
            }

            // Prevent other switching while we're in the middle of rendering this current switch
            this._isSwitchingContent = true;

            var nodeToAppend, nodeToRemove, rangeToRemove;

            // If there's no content currently inside the slot we need to have one for transition support which expects
            // a start and an end node; but we want to make sure the node is included in the rangeToRemove
            if (this._contentToRemove) {
                if (this._contentToRemove.nodeType) {
                    // The content is a node itself; use this node
                    nodeToRemove = this._contentToRemove;
                } else if (this._contentToRemove.element) {
                    // The content has an element property set; use the element
                    nodeToRemove = this._contentToRemove.element;
                }
            } else {
                if (this.transition) {
                    nodeToRemove = document.createElement("div");
                    nodeToRemove.id = "removeDiv";
                    // Since we're trying to remove this node it's expected to be in the slot already; put it there
                    this._element.appendChild(nodeToRemove);
                }
            }

            // If there is new content then whatever is in the slot currently needs to be removed
            if (this._contentHasChanged) {
                rangeToRemove = document.createRange();
                rangeToRemove.selectNodeContents(this._element);
            }

            // Figure out what node this slot is appending given the contentToAppend
            if (this._contentToAppend) {
                if (this._contentToAppend.nodeType) {
                    // The content is a node itself; use this node
                    nodeToAppend = this._contentToAppend;
                } else if (this._contentToAppend.element) {
                    // The content has an element property set; use the element
                    nodeToAppend = this._contentToAppend.element;
                }
            } else {
                if (this.transition) {
                    nodeToAppend = document.createElement("div");
                    nodeToAppend.id = "appendNode";
                }
            }

            // Make sure the nodeToAppend isn't already in the DOM
            if (nodeToAppend && nodeToAppend.parentNode) {
                nodeToAppend.parentNode.removeChild(nodeToAppend);
            }

            if (this.delegate && typeof this.delegate.slotWillSwitchContent === "function") {
                this.delegate.slotWillSwitchContent(this, nodeToAppend, this._contentToAppend, nodeToRemove, this._contentToRemove);
            }

            if (nodeToAppend) {

                this._element.appendChild(nodeToAppend);

                // Introduce to the componentTree if content appended was a component
                if (this._contentToAppend && (typeof this._contentToAppend.element !== "undefined")) {
                    this.childComponents = [this._contentToAppend];
                }
            }

            // Actually draw the change in content now
            if (this.transition) {

                var self = this,
                    cleanupCallback = function() {
                        self._cleanupAfterPopulating(nodeToAppend, nodeToRemove, rangeToRemove);
                    };

                this.transition.start(nodeToRemove, nodeToAppend, cleanupCallback);

            } else {
                this._cleanupAfterPopulating(nodeToAppend, nodeToRemove, rangeToRemove);
            }
        }
    },
/**
  Description TODO
  @private
*/
    _cleanupAfterPopulating: {
        value: function(appendedNode, removedNode, rangeToRemove) {

            if (rangeToRemove) {
                rangeToRemove.deleteContents();
                rangeToRemove.detach();
                this._contentHasChanged = false;
            }

            // If the old content was a component, remove it from the component tree
            if (this._contentToRemove && this._contentToRemove.parentComponent) {
                // TODO may also need to remove this from my drawlist, possibly elsewhere too
                this._contentToRemove._cachedParentComponent = null;
            }

            var removedContent = this._contentToRemove;

            this._content = this._contentToAppend;
            this._contentToAppend = null;
            this._contentToRemove = null;

            if (this.delegate && typeof this.delegate.slotDidSwitchContent === "function") {
                this.delegate.slotDidSwitchContent(this, appendedNode, this._content, removedNode, removedContent);
            }

            this._isSwitchingContent = false;
            this._canAppendContent = false;
        }
    }
});
