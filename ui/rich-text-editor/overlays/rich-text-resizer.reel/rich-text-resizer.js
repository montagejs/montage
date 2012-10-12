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
    @requires montage/core/geometry/point
    @requires montage/ui/component
    @requires montage/ui/dom
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    dom = require("ui/dom"),
    Point = require("core/geometry/point").Point;

/**
    @class module:"montage/ui/rich-text-editor/overlays/rich-text-resizer.reel".RichTextResizer
    @extends module:montage/ui/component.Component
*/
exports.RichTextResizer = Montage.create(Component,/** @lends module:"montage/ui/rich-text-editor/overlays/rich-text-resizer.reel".RichTextResizer# */ {

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
    _draggedElement: {
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
    editorMouseDown: {
        value: function(event) {
            var target = event.target;

            if (this._isActive && target === this.element) {
                event.preventDefault();
                event.stopPropagation();
                return true;
            }
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    editorTouchStart: {
        value: function(event) {
            this.editorMouseDown(event);
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    editorMouseUp: {
        value: function(event) {
            var target = event.target,
                previousTarget = this.target;

            // Ignore this call if we are curently capturing the pointer
            if (this._observedPointer) {
                return true;
            } else {
                if (target === this.element && this._editor.activeOverlay == this) {
                    this._editor.hideOverlay();
                    // We need to stop the event propagation to prevent the selection to be reset
                    event.target = this.target;     // Retarget the event
                    event.preventDefault();
                    event.stopPropagation();
                } else if (target.tagName === "IMG") {
                    if (target !== previousTarget) {
                        if (previousTarget) {
                            previousTarget.classList.remove("montage-Resizer-element");
                            if (previousTarget.classList.length == 0) {
                                previousTarget.removeAttribute("class");
                            }
                        }
                        this.target = target;
                        this._needsReset = true;
                        if (this._isActive) {
                            this.needsDraw = true;
                        } else {
                            this._ignoreNextSelectionchanged = true;
                            this._editor.showOverlay(this);
                        }
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    return true;
                } else if (this._editor.activeOverlay == this) {
                    this._editor.hideOverlay();
                }
            }

            return false;
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
            if (this._ignoreNextSelectionchanged || this._finalizeDrag) {
                this._ignoreNextSelectionchanged = false;
            } else {
                if (this._editor.activeOverlay == this) {
                    this._editor.hideOverlay();
                }
                this.target = null;
            }

            return false;
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
                editorElement = this._editor.innerElement,
                style;

            if (this._needsReset) {
                var offsetLeft,
                    offsetTop,
                    _findOffset = function(node) {
                        offsetTop = node.offsetTop;
                        offsetLeft = node.offsetLeft;

                        while ((node = node.offsetParent) && node != editorElement) {
                            offsetTop += node.offsetTop;
                            offsetLeft += node.offsetLeft;
                        }
                    };
                _findOffset(target);

                // Initialize the resizer
                style = element.style;

                style.width = target.offsetWidth + "px";
                style.height = target.offsetHeight + "px";
                style.top = offsetTop + "px";;
                style.left = offsetLeft + "px";

                this._editor.innerElement.classList.remove("montage-Editor--resizing");
                target.classList.add("montage-Resizer-element");

                // Setup the image
                this.image.src = target.src;
                this.image.title = target.title;
                this.image.alt = target.alt;

                // Select the resizedElement
                this._selectElement(target);

                this._needsReset = false;
            }

            if (this._draggedElement) {
                // Resize the resizer
                var zero = Point.create().init(0, 0),
                    framePosition = dom.convertPointFromNodeToPage(element, zero),
                    cursor = this._cursorPosition,
                    direction = this._draggedElement.getAttribute("data-montage-id").substring("montage-resizer-handle-".length),
                    info = this._resizerFrameInfo,
                    ratio = info.ratio,
                    height = parseFloat(element.style.height, 10),
                    width = parseFloat(element.style.width, 10),
                    top = parseFloat(element.style.top, 10),
                    left = parseFloat(element.style.left, 10),
                    minSize = 15;

                this._editor.innerElement.classList.add("montage-Editor--resizing");

                if (direction == "n") {
                    height += framePosition.y - cursor.y;
                    top = info.top - (height - info.height);
                } else if (direction == "ne") {
                    height += framePosition.y - cursor.y;
                    width = Math.round(height * ratio);
                    if (cursor.x > (framePosition.x + width)) {
                        width = cursor.x - framePosition.x;
                        height = Math.round(width / ratio);
                    }
                    top = info.top - (height - info.height);
                } else if (direction == "e") {
                    width = cursor.x - framePosition.x;
                } else if (direction == "se") {
                    height = cursor.y - framePosition.y;
                    width = Math.round(height * ratio);
                    if (cursor.x > (framePosition.x + width)) {
                        width = cursor.x - framePosition.x;
                        height = Math.round(width / ratio);
                    }
                } else if (direction == "s") {
                    height = cursor.y - framePosition.y;
                } else if (direction == "sw") {
                    height = cursor.y - framePosition.y;
                    width = Math.round(height * ratio);
                    if (cursor.x <= framePosition.x - width + element.clientWidth) {
                        width = element.clientWidth + framePosition.x - cursor.x;
                        height = Math.round(width / ratio);
                    }
                    left = info.left - (width - info.width);
                } else if (direction == "w") {
                    width += framePosition.x - cursor.x;
                    left = info.left - (width - info.width);
                } else if (direction == "nw") {
                    height += framePosition.y - cursor.y;
                    width = Math.round(height * ratio);
                    if (cursor.x <= framePosition.x - width + element.clientWidth) {
                        width = element.clientWidth + framePosition.x - cursor.x;
                        height = Math.round(width / ratio);
                    }
                    top = info.top - (height - info.height);
                    left = info.left - (width - info.width);
                }

                //set the frame's new height and width
                if (height > minSize && width > minSize) {
                    element.style.height = height + "px";
                    element.style.width = width + "px";
                    element.style.top = top + "px";
                    element.style.left = left + "px";
                }
            }

            if (this._finalizeDrag) {
                width = element.clientWidth;
                height = element.clientHeight;

                this._editor.innerElement.classList.remove("montage-Editor--resizing");
                target.classList.remove("montage-Resizer-element");
                if (target.classList.length == 0) {
                    target.removeAttribute("class");
                }

                // Select the resizedElement (just in case)
                this._selectElement(target);

                // Take the element offline to modify it
                var div = document.createElement("div"),
                    offlineElement,
                    savedID;
                div.appendChild(target.cloneNode(true));
                offlineElement = div.firstChild;

                // Resize the element now that it's offline
                offlineElement.width = width;
                offlineElement.height = height;
                offlineElement.style.removeProperty("width");
                offlineElement.style.removeProperty("height");

                savedID = offlineElement.id;
                offlineElement.id = "montage-editor-resized-image";

                // Inject the resized element into the contentEditable using execCommand in order to be in the browser undo queue
                this._editor.execCommand("inserthtml", false, div.innerHTML, "Resizing Image");
                target = document.getElementById(offlineElement.id);
                if (target) {
                    if (savedID !== undefined && savedID !== "") {
                        target.id = savedID;
                    } else {
                        target.removeAttribute("id");
                    }

                    // Add back the resizer
                    this.target = target;
                    this._needsReset = true;
                    this.needsDraw = true;
                }

                this._finalizeDrag = false;
            }
        }
    },

    /**
    Description TODO
    @function
    */
    didBecomeActive: {
        value: function() {
            this._isActive = true;
            this.element.addEventListener(window.Touch ? "touchstart" : "mousedown", this, false);
            window.addEventListener("resize", this, false);
        }
    },

    /**
    Description TODO
    @function
    */
    didBecomeInactive: {
        value: function() {
            var target = this.target;

            this._isActive = false;

            this.element.removeEventListener(window.Touch ? "touchstart" : "mousedown", this, false);
            window.removeEventListener("resize", this, false);

            if (this._draggedElement) {
                if (window.Touch) {
                    document.removeEventListener("touchmove", this);
                    document.removeEventListener("touchend", this);
                } else {
                    document.removeEventListener("mousemove", this);
                    document.removeEventListener("mouseup", this);
                }
                this._releaseInterest();
            }

            if (target) {
                // Let's do some extra cleanup
                target.classList.remove("montage-Resizer-element");
                if (target.classList.length == 0) {
                    target.removeAttribute("class");
                }
                this._editor.markDirty();
            }

            //Reset the resizer internal
            this.target = null;
            this._needsReset = false;
            this._draggedElement = null;
            this._finalizeDrag = false;
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
    },

    /**
    Description TODO
    @function
    */
    handleMousedown: {
        value: function(event) {
            var target = event.target,
                element = this.element;

            if (target.classList.contains("montage-Resizer-handle")) {
                if (window.Touch) {
                    this._observePointer(target.id);
                    document.addEventListener("touchmove", this);
                    document.addEventListener("touchend", this);
                } else {
                    this._observePointer("mouse");
                    document.addEventListener("mousemove", this);
                    document.addEventListener("mouseup", this);
                }

                this._resizerFrameInfo = {
                    width: element.clientWidth,
                    height: element.clientHeight,
                    left: parseInt(element.style.left, 10),
                    top: parseInt(element.style.top, 10),
                    ratio: element.clientWidth / element.clientHeight
                };
                this._cursorPosition = {x:event.pageX, y:event.pageY};
                this._draggedElement = target;

                event.preventDefault();
                event.stopPropagation();
            }
        }
    },

    /**
    Description TODO
    @function
    */
    handleTouchstart: {
        value: function(event) {
            this.handleMousedown(event);
        }
    },

    /**
    Description TODO
    @function
    */
    handleMousemove: {
        value: function(event) {

            this._cursorPosition = {x:event.pageX, y:event.pageY};
            this.needsDraw = true;

            event.preventDefault();
            event.stopPropagation();
        }
    },

    /**
    Description TODO
    @function
    */
    handleTouchmove: {
        value: function(event) {
            this.handleMousemove(event);
        }
    },

    /**
    Description TODO
    @function
    */
    handleMouseup: {
        value: function(event) {
            if (this._draggedElement) {
                if (window.Touch) {
                    document.removeEventListener("touchmove", this);
                    document.removeEventListener("touchend", this);
                } else {
                    document.removeEventListener("mousemove", this);
                    document.removeEventListener("mouseup", this);
                }

                this._draggedElement = null;

                this._finalizeDrag = true;
                this.needsDraw = true;

                this._releaseInterest();

                event.preventDefault();
                event.stopPropagation();
            }
        }
    },

    /**
    Description TODO
    @function
    */
    handleTouchend: {
        value: function(event) {
            this.handleMouseup(event);
        }
    },

    /**
    Description TODO
    @function
    @param {String} pointer TODO
    @param {Component} demandingComponent TODO
    @returns {Boolean} false
    */
    surrenderPointer: {
        value: function(pointer, demandingComponent) {
            return false;
        }
    },

    /**
    Description TODO
    @private
    */
    _observePointer: {
        value: function(pointer) {
            this.eventManager.claimPointer(pointer, this);
            this._observedPointer = pointer;
        }
    },

    /**
    Description TODO
    @private
    */
    _releaseInterest: {
        value: function() {
            this.eventManager.forfeitPointer(this._observedPointer, this);
            this._observedPointer = null;
        }
    },

    /**
    Description TODO
    @private
    */
    _selectElement: {
        value: function(element) {
            var offset,
                range;

            this._ignoreNextSelectionchanged = true;
            this._editor.selectElement(element);
        }
    }
});
