/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/rich-text-resizer.js"
    @requires montage/core/core
*/
var Montage = require("montage").Montage,
    dom = require("ui/dom"),
    Point = require("core/geometry/point").Point;

/**
    @class module:"montage/ui/rich-text-resizer.js".Resizer
    @extends module:montage/core/core.Montage
*/
exports.Resizer = Montage.create(Montage,/** @lends module:"montage/ui/rich-text-resizer.js".Resizer# */ {

    _editor: {
        value: null
    },

    _element: {
        value: null
    },

    element: {
        get: function() {
            return this._element;
        }
    },

    initialize: {
        value: function(editor) {
            this._editor = editor;
        }
    },

    show: {
        value: function(element) {
                // Remove the current resizer
                if (this._element) {
                    this._removeResizer(element);
                }
                if (element) {
                    this._addResizer(element);
                }
                this._element = element;
        }
    },

    hide: {
        value: function() {
            this._removeResizer(this._element);
            this._element = null;
        }
    },

    cleanup: {
        value: function(contentNode) {
            var cleanContentNode = contentNode,
                resizers = contentNode.getElementsByClassName("montage-resizer"),
                nbrResizers,
                resizer,
                i;

            if (resizers) {
                // We don't want to hide the resizer, just return a copy of the content without the resizer
                cleanContentNode = contentNode.cloneNode(true);
                resizers = cleanContentNode.getElementsByClassName("montage-resizer");
                nbrResizers = resizers.length;

                // Note: We should not have more than one resizer, this is just in case...
                for (i = 0; i < nbrResizers; i ++) {
                    resizer = resizers[0];
                    resizer.parentNode.removeChild(resizer);
                }
            }

            return cleanContentNode;
        }
    },

    draw : {
        value: function() {
            var thisRef = this;

            if (this._draggedElement) {
                // Resize the resizer frame
                var frame = this._draggedElement.parentNode.firstChild,
                    zero = Point.create().init(0, 0),
                    framePosition = dom.convertPointFromNodeToPage(frame, zero),
                    cursor = this._cursorPosition,
                    direction = this._draggedElement.id.substring("editor-resizer-".length),
                    info = this._resizerFrameInfo,
                    ratio = info.ratio,
                    height = frame.clientHeight,
                    width = frame.clientWidth,
                    top = parseFloat(frame.style.top, 10),
                    left = parseFloat(frame.style.left, 10),
                    minSize = 15;

                element = this._draggedElement.parentNode.previousSibling;

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
                    if (cursor.x <= framePosition.x - width + frame.clientWidth) {
                        width = frame.clientWidth + framePosition.x - cursor.x;
                        height = Math.round(width / ratio);
                    }
                    left = info.left - (width - info.width);
                } else if (direction == "w") {
                    width += framePosition.x - cursor.x;
                    left = info.left - (width - info.width);
                } else if (direction == "nw") {
                    height += framePosition.y - cursor.y;
                    width = Math.round(height * ratio);
                    if (cursor.x <= framePosition.x - width + frame.clientWidth) {
                        width = frame.clientWidth + framePosition.x - cursor.x;
                        height = Math.round(width / ratio);
                    }
                    top = info.top - (height - info.height);
                    left = info.left - (width - info.width);
                }

	            //set the frame's new height and width
	            if (height > minSize && width > minSize) {
		            frame.style.height = height + "px";
                    frame.style.width = width + "px";
                    frame.style.top = top + "px";
                    frame.style.left = left + "px";
	            }

                if (this._finalizeDrag) {
                    this._draggedElement.parentNode.classList.remove("dragged");
                    delete this._finalizeDrag;
                    delete this._resizerFrameInfo;
                    delete this._draggedElement;

                    // Remove the resizer, we don't wont it in case of undo!
                    this._removeResizer(element);

                    // Prevent the editor to try to delete the resizer from now on due to a selection change
                    this._editor._selectingResizer = true;

                    // Take the element offline to modify it
                    var div = document.createElement("div"),
                        offlineElement,
                        savedID;
                    div.innerHTML = element ? element.outerHTML : "";
                    offlineElement = div.firstChild;

                    // Resize the element now that it's offline
                    offlineElement.width = (width + 1);
                    offlineElement.height = (height + 1);
                    offlineElement.style.removeProperty("width");
                    offlineElement.style.removeProperty("height");

                    savedID = offlineElement.id;
                    offlineElement.id = "montage-editor-resized-image";

                    // Inject the resized element into the contentEditable using execCommand in order to be in the browser undo queue
                    document.execCommand("inserthtml", false, div.innerHTML);
                    element = document.getElementById(offlineElement.id);
                    if (element && savedID !== undefined) {
                        element.id = savedID;
                    }
                    this._element = element;

                    // Add back the resizer
                    this._addResizer(element);

                    // Reset the selection (using the editor's internal
                    offset = this._editor._nodeOffset(element);
                    range = document.createRange();
                    range.setStart(element.parentNode, offset);
                    range.setEnd(element.parentNode, offset + 1);
                    this._editor._selectedRange = range;

                    // Note: Chrome (and maybe other browsers) will fire 2 selectionchange event asynchronously, to work around it let's use a timer
                    setTimeout(function() {delete thisRef._editor._selectingResizer;}, 0);
                } else {
                    this._draggedElement.parentNode.classList.add("dragged");
                }
            }
        }
    },

    startUserAction: {
        value: function(event) {
            var element = event.target,
                frame;

            if (element.classList.contains("montage-resizer-handle")) {
                if (window.Touch) {
                    this._editor._observePointer(target.id);
                    document.addEventListener("touchmove", this);
                } else {
                    this._editor._observePointer("mouse");
                    document.addEventListener("mousemove", this);
                }

                this._draggedElement = element;

                frame = element.parentNode.firstChild;
                this._resizerFrameInfo = {
                    width: frame.clientWidth,
                    height: frame.clientHeight,
                    left: parseInt(frame.style.left, 10),
                    top: parseInt(frame.style.top, 10),
                    ratio: frame.clientWidth / frame.clientHeight
                };
                this._cursorPosition = {x:event.pageX, y:event.pageY};

                return true;
            }

            return false;
        }
    },

    endUserAction: {
        value: function(event) {
            if (this._draggedElement && !this._finalizeDrag) {
                // We are dragging the resizer
                if (window.Touch) {
                    document.removeEventListener("touchmove", this, false);
                } else {
                    this._cursorPosition = {x:event.pageX, y:event.pageY};
                    document.removeEventListener("mousemove", this, false);
                }

                this._editor._releaseInterest();

                this._finalizeDrag = true;
                this._editor.needsDraw = true;

                event.preventDefault();
                event.stopPropagation();

                return true;
            }

            return false;
        }
    },

    handleMousemove: {
        value: function(event) {
            if (this._draggedElement) {
                // We are dragging the resizer

                this._cursorPosition = {x:event.pageX, y:event.pageY};
                this._editor.needsDraw = true;

                event.preventDefault();
                event.stopPropagation();
            }
        }
    },

    handleTouchmove: {
        value: function(event) {
            this.handleMousemove(event);
        }
    },

    _addResizer: {
        enumerable: true,
        value: function(element) {
            var parentNode = element.parentNode,
                nextSibling = element.nextSibling,
                frame,
                w  = element.offsetWidth -1,
                h  = element.offsetHeight -1,
                l  = element.offsetLeft,
                t  = element.offsetTop,
                resizerFrameHtml = '<div id="montage-resizer" class="montage-resizer">' +
                    '<div id="editor-resizer-frame" class="montage-resizer-frame" style="width:'+ w + 'px; height:' + h + 'px; left:' + l + 'px; top:' + t + 'px"></div>' +
                    '<div id="editor-resizer-nw" class="montage-resizer-handle montage-resizer-nw" style="left:' + (l - 4) + 'px; top:' + (t - 4) + 'px"></div>' +
                    '<div id="editor-resizer-n" class="montage-resizer-handle montage-resizer-n" style="left:' + (l-3+ (w/2)) + 'px; top:' + (t-4)+ 'px"></div>' +
                    '<div id="editor-resizer-ne" class="montage-resizer-handle montage-resizer-ne" style="left:' + (l+w-2) + 'px; top:' + (t-4) + 'px"></div>' +
                    '<div id="editor-resizer-w" class="montage-resizer-handle montage-resizer-w" style="left:' + (l-4) + 'px; top:' + (t-3 + (h/2)) + 'px"></div>' +
                    '<div id="editor-resizer-e" class="montage-resizer-handle montage-resizer-e" style="left:' +(l+w-2) + 'px; top:' + (t-3+(h/2)) + 'px"></div>' +
                    '<div id="editor-resizer-sw" class="montage-resizer-handle montage-resizer-sw" style="left:' +(l-4) + 'px; top:' + (t+h-2) + 'px"></div>' +
                    '<div id="editor-resizer-s" class="montage-resizer-handle montage-resizer-s" style="left:' + (l-3+ (w/2)) + 'px; top:' + (t+h-2) + 'px"></div>' +
                    '<div id="editor-resizer-se" class="montage-resizer-handle montage-resizer-se" style="left:' + (l+w-2) + 'px; top:' + (t+h-2) + 'px"></div>' +
                    '</div>',
                i;

            // sanity check: make sure we don't already have a frame
            if (!nextSibling || nextSibling.tagName !== "DIV" || !nextSibling.classList.contains("montage-resizer")) {
                frame = document.createElement("DIV");
                frame.innerHTML = resizerFrameHtml;
                parentNode.insertBefore(frame.firstChild, nextSibling);
                element.classList.add("montage-resizer-element");
            }
        }
    },

    _removeResizer: {
        enumerable: true,
        value: function(element) {
            var resizer;

            if (!element) {
                return;
            }

            resizer = element.nextSibling;
            if (resizer && resizer.tagName === "DIV" && resizer.classList.contains("montage-resizer")) {
                element.parentNode.removeChild(resizer)
                element.classList.remove("montage-resizer-element");
            } else {
                // Handle case where the element has been removed from the DOM or the resizer is not in sync with the
                // element anymore (hapen after an undo)
                resizer = document.getElementById("montage-resizer");
                if (resizer && resizer.tagName === "DIV" && resizer.classList.contains("montage-resizer")) {
                    resizer.parentNode.removeChild(resizer);
                }
            }
        }
    }

});