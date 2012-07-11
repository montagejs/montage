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
	@module "montage/ui/rich-text-editor/overlays/rich-text-resizer.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
    @class module:"montage/ui/rich-text-editor/overlays/rich-text-linkpopup.reel".RichTextLinkPopup
    @extends module:montage/ui/component.Component
*/
exports.RichTextLinkPopup = Montage.create(Component,/** @lends module:"montage/ui/rich-text-editor/overlays/rich-text-linkpopup.reel".RichTextLinkPopup# */ {

    /**
      Description TODO
      @private
    */
    _isActive: {
        enumerable: false,
        value: false
    },
    /**
      Description TODO
      @private
    */
    _editor: {
        enumerable: false,
        value: null
    },

    /**
      Description TODO
      @private
    */
    target: {
        enumerable: false,
        value: null
    },

    /**
      Description TODO
      @private
    */
    _needsReset: {
        enumerable: false,
        value: false
    },

    /**
      Description TODO
     @type {Function}
    */
    initWithEditor: {
        value: function(editor) {
            this._editor = editor;
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    editorMouseUp: {
        value: function(event) {
            var element;

            if (this._editor.activeOverlay != this) {
                // Check if the caret is inside an image within an anchor element
                if (event.target.nodeName == "IMG") {
                    element = event.target;
                    while (element && element != this._element) {
                        if (element.nodeName == "A") {
                            if (element != this.target) {
                                this.target = element;
                                this._needsReset = true;
                                if (this._isActive) {
                                    this.needsDraw = true;
                                } else {
                                    this._editor.showOverlay(this);
                                }
                            }
                            return true;
                        }
                        element = element.parentElement;
                    }
                }
            }
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    editorTouchEnd: {
        value: function(event) {
            this.editorMouseUp(event);
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    editorSelectionDidChange: {
        value: function(range) {
            var element;

            // Check if the caret is inside an anchor element
            if (range && range.collapsed) {
                element = range.commonAncestorContainer;
                while (element && element != this._element) {
                    if (element.nodeName == "A") {
                        if (element != this.target) {
                            this.target = element;
                            this._needsReset = true;
                            if (this._isActive) {
                                this.needsDraw = true;
                            } else {
                                this._editor.showOverlay(this);
                            }
                        }
                        return true;
                    }
                    element = element.parentElement;
                }
            }

            if (this._editor.activeOverlay == this) {
                this._editor.hideOverlay();
            }
            this.target = null;

            return false;
        }
    },

    /**
    Description TODO
    @function
    */
    didBecomeActive: {
        value: function() {
            this._isActive = true;
            window.addEventListener("resize", this, false);
        }
    },

    /**
    Description TODO
    @function
    */
    didBecomeInactive: {
        value: function() {
            this._isActive = false;
            window.removeEventListener("resize", this, false);

            //Reset the resizer internal
            this.target = null;
            this._needsReset = false;
        }
    },

    /**
    Description TODO
    @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {
            this._popupExtraWidth = this.element.offsetWidth;
        }
    },

    /**
    Description TODO
    @function
    */
    draw: {
        enumerable: false,
        value: function() {
            var element = this.element,
                target = this.target,
                editorElement = this._editor.innerElement;

            if (this._needsReset) {
                var offsetLeft,
                    offsetTop,
                    oh = editorElement.offsetHeight,
                    ow = editorElement.offsetWidth,
                    st = editorElement.scrollTop,
                    sl = editorElement.scrollLeft,
                    w = target.offsetWidth,
                    h = target.offsetHeight,
                    l, t,
                    left, leftWidth, right, rightWidth,
                    style = "";

                var _findOffset = function(node) {
                        offsetTop = node.offsetTop;
                        offsetLeft = node.offsetLeft;

                        while ((node = node.offsetParent) && node != editorElement) {
                            offsetTop += node.offsetTop;
                            offsetLeft += node.offsetLeft;
                        }
                    };
                _findOffset(target);

                l  = offsetLeft;
                t  = offsetTop;

                // Should we display the popup on top or below the element?
                if (t > 60 && t - st + h + 50 > oh) {
                    style = "bottom: " + (oh - t + 5) + "px;";
                } else {
                    style = "top: " + (t + h + 5 ) + "px;";
                }

                // Should we display the popup aligned on the left or right of the element?
                left = sl;
                right = sl + ow;
                leftWidth = right - l;
                rightWidth = l + w - left;

                if (leftWidth  > rightWidth) {
                    //Let's align the popup to the left of the element or to the far left
                    if (leftWidth < 150) {
                        style += " left: " + (left + 5) + "px;";
                        style += " max-width: " + (ow - 10 - this._popupExtraWidth) + "px;";
                    } else {
                        style += " left: " + (left + l) + "px;";
                        style += " max-width: " + (leftWidth - 5 - this._popupExtraWidth) + "px;";
                    }
                } else {
                    if (rightWidth < 150) {
                        style += " right: " + (left + 5) + "px;";
                        style += " max-width: " + (ow - 10 - this._popupExtraWidth) + "px;";
                    } else {
                        style += " right: " + (right - (left + l + w + 1)) + "px;";
                        style += " max-width: " + (rightWidth - this._popupExtraWidth) + "px;";
                    }
                }

                // Position and size the popup
                element.setAttribute("style", style);

                // Setup the anchor
                this.link.href = target.href;
                this.link.textContent = target.href;

                this._needsReset = false;
            }
        }
    },

    /**
    Description TODO
    @function
    */
    handleResize: {
        enumerable: false,
        value: function() {
            this._needsReset = true;
            this.needsDraw = true;
        }
    }

});
