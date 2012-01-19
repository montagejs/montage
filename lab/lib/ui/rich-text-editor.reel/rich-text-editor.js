/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/rich-text-editor.reel"
    @requires montage/core/core
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    MutableEvent = require("core/event/mutable-event").MutableEvent,
    Sanitizer = require("./rich-text-sanitizer").Sanitizer,
    dom = require("ui/dom"),
    Point = require("core/geometry/point").Point;

/**
    @class module:"montage/ui/rich-text-editor.reel".RichTextEditor
    @extends module:montage/ui/component.Component
*/
exports.RichTextEditor = Montage.create(Component,/** @lends module:"montage/ui/rich-text-editor.reel".RichTextEditor# */ {

    /**
      Description TODO
      @private
    */
    _hasSelectionChangeEvent: {
        enumerable: false,
        value: null     // Need to be preset to null, will be set to true or false later on
    },

    /**
      Description TODO
      @private
    */
    _uniqueId: {
        enumerable: false,
        value: Math.floor(Math.random() * 1000) + "-" + Math.floor(Math.random() * 1000)
    },

    /**
      Description TODO
      @private
    */
    _needSelectionReset: {
        enumerable: false,
        value: false
    },

    /**
      Description TODO
      @private
    */
    _selectionChangeTimer: {
        enumerable: false,
        value: null
    },

    /**
      Description TODO
      @private
    */
    _hasFocus: {
        enumerable: false,
        value: false
    },

    /**
      Description TODO
     @type {Function}
    */
    hasFocus: {
        enumerable: true,
        get: function() {
            return this._hasFocus;
        }
    },

    /**
      Description TODO
      @private
    */
    _dirty: {
        enumerable: false,
        value: false
    },

    /**
      Description TODO
      @private
    */
    _value: {
        enumerable: false,
        value: ""
    },

    /**
      Description TODO
     @type {Function}
    */
    value: {
        enumerable: true,
        get: function() {
            var contentNode = this.element.firstChild,
                content,
                resizer;

            if (this._dirtyValue) {
                if (this._currentResizerElement) {
                    // Remove the resizer from the returned data
                    contentNode = contentNode.cloneNode(true);
                    resizer = contentNode.getElementsByClassName("montage-resizer");
                    if (resizer && resizer.length) {
                        resizer = resizer[0]
                        resizer.parentNode.removeChild(resizer);
                    }
                }

                content = contentNode ? contentNode.innerHTML : "";
                if (content == "<br>") {
                    // when the contentEditable div is emptied, Chrome add a <br>, let's filter it out
                    content = "";
                }
                if (this._sanitizer) {
                    content = this._sanitizer.unscopeCSS(content, this._uniqueId);
                }

                this._value = content;
                this._dirtyValue = false;
            }
            return this._value;
        },
        set: function(value) {
            if (this._value !== value || this._dirtyValue) {
                // Cancel resizer
                if (this._currentResizerElement) {
                   this._removeResizer(this._currentResizerElement);
                   delete this._currentResizerElement;
                }

                if (this._sanitizer) {
                    value = this._sanitizer.scopeCSS(value, this._uniqueId);
                }
                this._value = value;
                this._dirtyValue = false;
                this._dirtyTextValue = true;
                this._needSelectionReset = true;
                this._needsResetContent = true;
                this.needsDraw = true;
            }
        }
    },

    /**
      Description TODO
      @private
    */
    _textValue: {
        enumerable: false,
        value: ""
    },

    /**
      Description TODO
     @type {Function}
    */
    textValue: {
        enumerable: true,
        get: function() {
            if (this._dirtyTextValue) {
                this._textValue = this.element.firstChild ? this.element.firstChild.innerText : "";
                this._dirtyTextValue = false;
            }
            return this._textValue;
        },
        set: function (value) {
            if (this._textValue !== value || this._dirtyTextValue) {
                // Cancel resizer
                if (this._currentResizerElement) {
                   this._removeResizer(this._currentResizerElement);
                   delete this._currentResizerElement;
                }

                this._textValue = value;
                this._dirtyTextValue = false;
                this._dirtyValue = true;
                this._needSelectionReset = true;
                this._needsResetContent = true;
                this.needsDraw = true;
            }
        }
    },

    /**
      Description TODO
     @type {}
    */
    delegate: {
        enumerable: true,
        value: null
    },

    /**
      Description TODO
      @private
    */
    _statesDirty: {
        enumerable: false,
        value: false
    },

    /**
      Description TODO
      @private
    */
    _states: {
        enumerable: false,
        value: null
    },

    /**
      Description TODO
     @type {Function}
    */
    states: {
        enumerable: true,
        get: function() {
            this.updateStates();
            return this._states;
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    updateStates: {
        enumerable: true,
        value: function() {
            var actions = this._actions,
                key,
                action,
                states,
                state,
                statesChanged = false,
                hasFocus = this._hasFocus;

            if (this._states == null || this._statesDirty) {
                this._states = this._states || {};
                this._statesDirty = false;

                if (hasFocus) {
                    states = this._states;
                    for (key in actions) {
                        action = actions[key];
                        state = "false";
                        if (action.enabled && action.status) {
                            state = document.queryCommandValue(key);
                            if (typeof state == "boolean") {
                                state = state ? "true" : "false";
                            }
                            // JFD TODO: We might need to do some conversion for fontsize, fontname and colors
                        }

                        if (states[key] !== state) {
                            states[key] = state;
                            statesChanged = true;
                        }
                    }
                    if (statesChanged) {
                        this._states = states;
                        // As we do not use a setter, we need to manually dispatch a change event
                        this.dispatchEvent(MutableEvent.changeEventForKeyAndValue("states" , this._states));
                    }

                    if (this._states.fontname) {
                        this._states.fontname = this._states.fontname.replace(/'/g, "");
                    }
                }
            }

            return this._states;
        }
    },

    /**
      Description TODO
      @private
    */
    _allowDrop: {
        enumerable: false,
        value: true
    },

    /**
      Description TODO
     @type {Function}
    */
    allowDrop: {
        enumerable: true,
        get: function() {
            return this._allowDrop;
        },
        set: function(value) {
            this._allowDrop = value;
        }
    },

    /**
      Description TODO
      @private
    */
    _actions: {
        enumerable: false,
        value: {
            bold: {enabled: true, needsValue:false, status: true},
            italic: {enabled: true, needsValue:false, status: true},
            underline: {enabled: true, needsValue:false, status: true},
            strikethrough: {enabled: true, needsValue:false, status: true},
            indent: {enabled: true, needsValue:false, status: false},
            outdent: {enabled: true, needsValue:false, status: false},
            insertorderedlist: {enabled: true, needsValue:false, status: true},
            insertunorderedlist: {enabled: true, needsValue:false, status: true},
            fontname: {enabled: true, needsValue:true, status: true},
            fontsize: {enabled: true, needsValue:true, status: true},
            hilitecolor: {enabled: true, needsValue:true, status: true},
            forecolor: {enabled: true, needsValue:true, status: true}
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    actions: {
        enumerable: false,
        get: function() {
            var actions = this._actions,
                action,
                actionsArray = [];

            for (action in actions) {
                actionsArray.push(action);
            }

            return actionsArray;
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    enabledActions: {
        enumerable: true,
        get: function() {
            var actions = this._actions,
                action,
                actionsArray = [];

            for (action in actions) {
                if (actions[action].enabled) {
                    actionsArray.push(action);
                }
            }

            return actionsArray;
        },
        set: function(enabledActions) {
            var actions = this._actions,
                nbrEnabledActions = enabledActions.length,
                action,
                i;

            for (action in actions) {
                actions[action].enabled = false;
            }

            for (i = 0; i < nbrEnabledActions; i ++) {
                action = enabledActions[i];
                if (actions[action] !== undefined) {
                    actions[action].enabled = true;
                }
            }
        }
    },

    /**
      Description TODO
      @private
    */
    _sanitizer: {
        enumerable: false,
        value: Sanitizer.create()
    },

    /**
      Description TODO
     @type {Function}
    */
    sanitizer: {
        enumerable: false,
        get: function() {
            return  this._sanitizer;
        },
        set: function(value) {
            this._sanitizer = value;
        }
    },

    /**
      Description TODO
      @private
    */
    _needsFocus: {
        value: false
    },

    /**
      Description TODO
      @type {Function}
    */
    focus: {
        value: function() {
            this._needsFocus = true;
            this.needsDraw = true;
        }
    },
    
    // Component Callbacks
    /**
    Description TODO
    @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {
            var el = this.element,
                div;

            el.classList.add('montage-editor-frame');

            el.addEventListener("focus", this);
            el.addEventListener("dragstart", this, false);
            el.addEventListener("dragend", this, false);
            el.addEventListener("dragover", this, false);
            el.addEventListener("drop", this, false);

            this._needsResetContent = true;
        }
    },

    /**
    Description TODO
    @function
    */
    draw: {
        enumerable: false,
        value: function() {
            var thisRef = this,
                editorElement = this.element,
                element,
                range,
                offset;

            if (this._needsResetContent === true) {
                // Reset the editor content in order to reset the browser undo stack
                editorElement.innerHTML = '<div class="montage-editor editor-' + this._uniqueId + '" contentEditable="true"></div>';

                // Set the contentEditable value
                if (this._value && !this._dirtyValue) {
                    editorElement.firstChild.innerHTML = this._value;
                    // Since this property affects the textValue, we need to fire a change event for it as well
                    this.dispatchEvent(MutableEvent.changeEventForKeyAndValue("textValue" , this.textValue));
                } else if (this._textValue && !this._dirtyTextValue) {
                    editorElement.firstChild.innerText = this._textValue;
                    // Since this property affects the value, we need to fire a change event for it as well
                    this.dispatchEvent(MutableEvent.changeEventForKeyAndValue("value" , this.value));
                } else {
                    editorElement.firstChild.innerHTML = "";
                }

                this._adjustPadding();
                delete this._needsResetContent;
            }

            if (this._drawNeedResizerOn !== undefined) {
                element = this._drawNeedResizerOn;
                if (element) {
                    this._removeResizer(this._currentResizerElement);
                    this._addResizer(element);
                    this._currentResizerElement = element;

                    // Select the element and its resizer
                    this._selectingResizer = true;
                    offset = this._nodeOffset(element);
                    range = document.createRange();
                    range.setStart(element.parentNode, offset);
                    range.setEnd(element.parentNode, offset + 1);
                    this._selectedRange = range;
                    // JFD Note: Chrome (and maybe other browsers) will fire 2 selectionchange event asynchronously, to work around it let's use a timer
                    setTimeout(function() {delete thisRef._selectingResizer;}, 0);
                } else {
                    this._removeResizer(this._currentResizerElement);
                    delete this._currentResizerElement
                }

                delete this._drawNeedResizerOn;
            }

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

                    // Take the element offline tp modify it
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
                    this._currentResizerElement = element;

                    // Add back the resizer frame
                    this._addResizer(element);

                    // Reset the selection
                    this._selectingResizer = true;
                    offset = this._nodeOffset(element);
                    range = document.createRange();
                    range.setStart(element.parentNode, offset);
                    range.setEnd(element.parentNode, offset + 1);
                    this._selectedRange = range;
                    // JFD Note: Chrome (and maybe other browsers) will fire 2 selectionchange event asynchronously, to work around it let's use a timer
                    setTimeout(function() {delete thisRef._selectingResizer;}, 0);

                } else {
                    this._draggedElement.parentNode.classList.add("dragged");
                }
            }
            
            if (this._needsFocus) {
                this.element.firstChild.focus();
                if(document.activeElement == this.element.firstChild) {
                    this._needsFocus = false;
                } else {
                    // Make sure the element is visible before trying again to set the focus
                    var style = window.getComputedStyle(this.element);
                    if (style.getPropertyValue("visibility") == "hidden" || style.getPropertyValue("display") == "none") {
                        this._needsFocus = false;
                    } else {
                        this.needsDraw = true;
                    }
                }
            }
        }
    },

    /**
    Description TODO
    @function
    */
    _adjustPadding: {
        enumerable: false,
        value: function() {
            var el = this.element.firstChild,
                minLeft = 0,
                minTop = 0;

            var walkTree = function(node, parentLeft, parentTop) {
                var nodes = node ? node.childNodes : [],
                    nbrNodes = nodes.length,
                    i,
                    offsetLeft = node.offsetLeft,
                    offsetTop = node.offsetTop;

                if (node.offsetParent) {
                    offsetLeft += parentLeft;
                    offsetTop += parentTop;
                }
                if (minLeft > offsetLeft) {
                    minLeft = offsetLeft;
                }
                if (minTop > offsetTop) {
                    minTop = offsetTop;
                }

                for (i = 0; i < nbrNodes; i ++) {
                    walkTree(nodes[i], offsetLeft, offsetTop)
                }
            };
            walkTree(el, el.offsetLeft, el.offsetTop);

            var computedStyle = document.defaultView.getComputedStyle(el),
                paddingLeft = computedStyle.paddingLeft,
                paddingTop = computedStyle.paddingTop;

            if (paddingLeft.match(/%$/)) {
                paddingLeft = parseInt(paddingLeft, 10) * el.clientWidth;
            } else {
                paddingLeft = parseInt(paddingLeft, 10);
            }
            if (paddingTop.match(/%$/)) {
                paddingTop = parseInt(paddingTop, 10) * el.clientHeight;
            } else {
                paddingTop = parseInt(paddingTop, 10);
            }

            if (minLeft < 0) {
                el.style.paddingLeft = (-minLeft - paddingLeft) + "px";
            }
            if (minTop < 0) {
                el.style.paddingTop = (-minTop - paddingTop) + "px";
            }
        }
    },

    // Event handlers
    // Event handlers
    /**
    Description TODO
    @function
    */
    handleFocus: {
        enumerable: false,
        value: function() {
            var thisRef = this,
                el = this.element,
                content = el.firstChild,
                savedRange;

            this._hasFocus = true;
            if (this._needSelectionReset) {
                var node = this._lastInnerNode(),
                    range,
                    length,
                    leafNodes = ["#text", "BR", "IMG"];

                // Select the last inner node
                if (node) {
                    if (leafNodes.indexOf(node.nodeName) !== -1) {
                        node = node.parentNode;
                    }
                    range = document.createRange();
                    length = node.childNodes ? node.childNodes.length : 0;
                    range.setStart(node, length);
                    range.setEnd(node, length);
                    this._selectedRange = range;
                }

                // Scroll the content to make sure the caret is visible, but only only if the focus wasn't the result of a user click/touch
                savedRange = this._selectedRange;
                setTimeout(function() {
                    if (thisRef._equalRange(thisRef._selectedRange, savedRange)) {
                        content.scrollTop = content.scrollHeight;
                    }
                }, 0);

                this._needSelectionReset = false;
            }

            el.addEventListener("blur", this);
            el.addEventListener("input", this);
            el.addEventListener("keypress", this);
            el.addEventListener("paste", this, false);
            el.addEventListener(window.Touch ? "touchstart" : "mousedown", this);
            document.addEventListener(window.Touch ? "touchend" : "mouseup", this);

            document.addEventListener("selectionchange", this, false);
            // Check if the browser does not supports the DOM event selectionchange
            if (this._hasSelectionChangeEvent === null) {
                var thisRef = this;
                setTimeout(function(){
                    if (thisRef._hasSelectionChangeEvent === null) {
                        thisRef._hasSelectionChangeEvent = false;
                    }
                }, 0);
            }
            if (this._hasSelectionChangeEvent === false) {
                // We need to listen to more event in order to simulate a selectionchange event
                el.addEventListener("keydup", this);
            }

            // Turn off image resize (if supported)
            document.execCommand("enableObjectResizing", false, false);
            // Force use css for styling (if supported)
            document.execCommand("styleWithCSS", false, true);
        }
    },

    /**
    Description TODO
    @function
    */
    handleBlur: {
        enumerable: false,
        value: function() {
            var el = this.element;

            // Force a selectionchange when we lose the focus
            this.handleSelectionchange();

            el.removeEventListener("blur", this);
            el.removeEventListener("input", this);
            el.removeEventListener("keypress", this);
            el.removeEventListener("paste", this, false);
            el.removeEventListener(window.Touch ? "touchstart" : "mousedown", this);
            document.removeEventListener(window.Touch ? "touchend" : "mouseup", this);

            document.removeEventListener("selectionchange", this);

            if (this._hasSelectionChangeEvent === false) {
                el.removeEventListener("keydup", this);
            }

            this._hasFocus = false;
        }
    },

    /**
    Description TODO
    @function
    */
    handleKeypress: {
        enumerable: false,
        value: function() {
            if (this._hasSelectionChangeEvent === false) {
                this.handleSelectionchange();
            }
            this._markDirty();
        }
    },

    /**
    Description TODO
    @function
    */
    handleInput: {
        enumerable: false,
        value: function(event) {
            // If the resizer what show, hide it
            if (this._currentResizerElement) {
               if (this._removeResizer(this._currentResizerElement)) {
                   delete this._currentResizerElement;
               }
            }

            if (this._hasSelectionChangeEvent === false) {
                this.handleSelectionchange();
            }
            this.handleDragend(event);
            this._markDirty();
        }
    },

    /**
    Description TODO
    @function
    */
    handleShortcut: {
        enumerable: false,
        value: function(event, action) {
            if (this._actions[action] && this._actions[action].enabled) {
                this.doAction(action);
                return true;
            }

            return false;
        }
    },

    /**
    Description TODO
    @function
    */
    handleMousedown: {
        enumerable: false,
        value: function(event) {
            // Check if we are inside a resizer handle
            var element = event.target,
                frame;

            if (element.classList.contains("montage-resizer-handle")) {
                if (window.Touch) {
                    this._observePointer(target.id);
                    document.addEventListener("touchmove", this);
                } else {
                    this._observePointer("mouse");
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

                event.preventDefault();
                event.stopPropagation();
            }
        }
    },

    /**
    Description TODO
    @function
    */
    handleMousemove: {
        enumerable: false,
        value: function(event) {
            if (this._draggedElement) {
                // We are dragging the resizer

                this._cursorPosition = {x:event.pageX, y:event.pageY};
                this.needsDraw = true;

                event.preventDefault();
                event.stopPropagation();
            }
        }
    },

    /**
    Description TODO
    @function
    */
    handleMouseup: {
        enumerable: false,
        value: function(event) {
            var thisRef = this,
                element = event.target,
                range,
                offset;

            if (this._draggedElement) {
                // We are dragging the resizer
                if (window.Touch) {
                    document.removeEventListener("touchmove", this, false);
                } else {
                    this._cursorPosition = {x:event.pageX, y:event.pageY};
                    document.removeEventListener("mousemove", this, false);
                }

                this._releaseInterest();

                this._finalizeDrag = true;
                this.needsDraw = true;

                event.preventDefault();
                event.stopPropagation();
                return;
            }

            if (element.tagName === "IMG") {
                if (this._currentResizerElement !== element) {
                    this._drawNeedResizerOn = element;
                    this.needsDraw = true;
                }
            } else {
                if (this._currentResizerElement) {
                    this._drawNeedResizerOn = null;
                    this.needsDraw = true;
                }

                if (this._hasSelectionChangeEvent === false) {
                    this.handleSelectionchange();
                }
                this.handleDragend(event);
            }
        }
    },

    /**
    Description TODO
    @function
    */
    handleTouchstart: {
        enumerable: false,
        value: function() {
            this.handleMousedown(event);
        }
    },

    /**
    Description TODO
    @function
    */
    handleTouchend: {
        enumerable: false,
        value: function() {
            this.handleMouseup(event);
        }
    },

    /**
    Description TODO
    @function
    */
    handleSelectionchange: {
        enumerable: false,
        value: function() {
            var thisRef = this;

            if (this._ignoreSelectionchange) {
                return;
            }

            if (this._hasSelectionChangeEvent == null) {
                this._hasSelectionChangeEvent = true;
            }

            if (this._currentResizerElement) {
                if (this._selectingResizer !== true) {
                    this._removeResizer(this._currentResizerElement);
                    delete this._currentResizerElement;
                }
            }

            this._statesDirty = true;
            if (this._selectionChangeTimer) {
                clearTimeout(this._selectionChangeTimer);
            }
            this._selectionChangeTimer = setTimeout(function() {
                thisRef._dispatchEditorEvent("editorSelect");
            }, 50);
        }
    },

    /**
    Description TODO
    @function
    */
    handleDragstart: {
        enumerable: false,
        value: function(event) {
            var element = event.target;
            if (element === this._currentResizerElement) {
                // We are showing the resize frame, prevent dragging the image
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            // let's remember which element we are dragging
            this._dragSourceElement = event.srcElement;
        }
    },

    /**
    Description TODO
    @function
    */
    handleDragend: {
        enumerable: false,
        value: function(event) {
            delete this._dragSourceElement;
            delete this._dragOverX;
            delete this._dragOverY;

            this.handleSelectionchange();
        }
    },

    /**
    Description TODO
    @function
    */
    handleDragover: {
        enumerable: false,
        value: function(event) {
            var range;

            // If we are moving an element from within the ourselves, let the browser deal with it...
            if (this._dragSourceElement) {
                return;
            }

            // JFD TODO: check if drop type is acceptable...
            event.dataTransfer.dropEffect = this._allowDrop ? "copy" : "none";

            event.preventDefault();
            event.stopPropagation();

            // Update the caret
            if (event.x !== this._dragOverX || event.y !== this._dragOverY) {
                this._dragOverX = event.x;
                this._dragOverY = event.y;

                this._ignoreSelectionchange = true;
                if (document.caretRangeFromPoint) {
                    range = document.caretRangeFromPoint(event.x, event.y);
                } else if (event.rangeParent && event.rangeOffset) {
                    range = document.createRange();
                    range.setStart(event.rangeParent, event.rangeOffset);
                    range.setEnd(event.rangeParent, event.rangeOffset);
                }

                if (range) {
                    this._selectedRange = range;
                }
                delete this._ignoreSelectionchange;
            }
        }
    },

    /**
    Description TODO
    @function
    */
    handleDrop: {
        enumerable: false,
        value: function(event) {
            var files = event.dataTransfer.files,
                fileLength = files.length,
                file,
                data,
                reader,
                i,
                delegateMethod,
                response;

            if (this._dragSourceElement) {
                // Let the browser do the job for us, just make sure we cleanup after us
                this.handleDragend(event);
                this.handleSelectionchange();
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            if (fileLength) {
                for (i = 0; i < fileLength; i ++) {
                    file = files[i];
                    delegateMethod = this._delegateMethod("fileDrop");
                    response = true;

                    if (window.FileReader) {
                        reader = new FileReader();
                        reader.onload = function() {
                            data = reader.result;

                            if (delegateMethod) {
                                response = delegateMethod.call(this.delegate, this, file, data);
                            }
                            if (response === true) {
                                if (file.type.match(/^image\//i)) {
                                    document.execCommand("insertimage", false, data);
                                    this._markDirty();
                                }
                            }
                        }
                        reader.onprogress = function(e) {
                        }
                        reader.onerror = function(e) {
                        }
                        reader.readAsDataURL(file);
                    } else {
                        // Note: This browser does not support the File API, we cannot do a preview...
                        if (delegateMethod) {
                            response = delegateMethod.call(this.delegate, this, file);
                        }
                        if (response === true) {
                            // TODO: for now, we do nothing, up to the consumer to deal with that case
                        }
                    }
                }
            } else {
                data = event.dataTransfer.getData("text/html");
                if (data) {
                    // Sanitize Fragment (CSS & JS)
                    if (this._sanitizer) {
                        data = this._sanitizer.scopeCSS(this._sanitizer.removeScript(data));
                    }
                } else {
                    data = event.dataTransfer.getData("text/plain") || event.dataTransfer.getData("text");
                    if (data) {
                        var div = document.createElement('div');
                        div.innerText = data;
                        data = div.innerHTML;
                    }
                }
                if (data) {
                    var delegateMethod = this._delegateMethod("drop"),
                        response;

                    if (delegateMethod) {
                        response = delegateMethod.call(this.delegate, this, data, "text/html");
                        if (response === true) {
                            data = data.replace(/\<meta [^>]+>/gi, ""); // Remove the meta tag.
                        } else {
                            data = response === false ? null : response ;
                        }
                    } else {
                        data = data.replace(/\<meta [^>]+>/gi, ""); // Remove the meta tag.
                    }
                    if (data && data.length) {
                        document.execCommand("inserthtml", false, data);
                        this._markDirty();
                    }
                }
            }
            this.handleDragend(event);
        }
    },

    /**
    Description TODO
    @function
    */
    handlePaste: {
        enumerable: false,
        value: function(event) {
            var clipboardData = event.clipboardData,
                data = clipboardData.getData("text/html"),
                delegateMethod,
                response,
                div,
                isHTML,
                item,
                file,
                reader;

            /* NOTE: Chrome, and maybe the other browser too, returns html or plain text data when calling getData("text/html),
                     To determine if the data is actually html, check the data starts with either an html or a meta tag
            */

            isHTML = data && data.match(/^<meta [^>]*>|<html>/i);
            if (data && isHTML) {
                // Sanitize Fragment (CSS & JS)
                if (this._sanitizer) {
                    data = this._sanitizer.scopeCSS(this._sanitizer.removeScript(data));
                }
            } else {
                data = clipboardData.getData("text/plain") ||  clipboardData.getData("text");
                if (data) {
                    // Convert plain text to html
                    div = document.createElement('div');
                    div.innerText = data;
                    data = div.innerHTML;
                }
            }

            if (data) {
                delegateMethod = this._delegateMethod("paste");
                if (delegateMethod) {
                    response = delegateMethod.call(this.delegate, this, data, "text/html");
                    if (response === true) {
                        data = data.replace(/\<meta [^>]+>/gi, ""); // Remove the meta tag.
                    } else {
                        data = response === false ? null : response ;
                    }
                } else {
                    data = data.replace(/\<meta [^>]+>/gi, ""); // Remove the meta tag.
                }
                if (data && data.length) {
                    document.execCommand("inserthtml", false, data);
                    this._markDirty();
                }
            } else {
                // Maybe we have trying to paste an image as Blob...
                if (clipboardData.items.length) {
                    item = clipboardData.items[0];
                    if (item.kind == "file" && item.type.match(/^image\/.*$/)) {
                        file = item.getAsFile();

                        response = true;

                        if (window.FileReader) {
                            reader = new FileReader();
                            reader.onload = function() {
                                data = reader.result;

                                this._delegateMethod("filePaste");
                                if (delegateMethod) {
                                    response = delegateMethod.call(this.delegate, this, file, data);
                                }
                                if (response === true) {
                                    if (file.type.match(/^image\//i)) {
                                        document.execCommand("insertimage", false, data);
                                        this._markDirty();
                                    }
                                }
                            }
                            reader.onprogress = function(e) {
                            }
                            reader.onerror = function(e) {
                            }
                            reader.readAsDataURL(file);
                        } else {
                            // Note: This browser does not support the File API, we cannot handle it directly...
                            if (delegateMethod) {
                                response = delegateMethod.call(this.delegate, this, file);
                            }
                            if (response === true) {
                                // TODO: for now, we do nothing, up to the consumer to deal with that case
                            }
                        }
                    }
                }
            }

            event.preventDefault();
            event.stopPropagation();
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

    // Actions
    /**
    Description TODO
    @function
    */
    handleAction: {
        enumerable: false,
        value: function(event) {
            var target = event.currentTarget,
                action = target.action || target.identifier,
                value = false;
            if (action) {
                if (this._actions[action].needsValue) {
                    value = target.actionValue;
                    if (value !== undefined) {
                        value = target[value];
                        if (value === undefined) {
                            value = target.actionValue;
                        }
                    } else {
                        value = target.value;
                    }

                    if (value === undefined) {
                        value = false;
                    }
                }
                this.doAction(action, value);
            }
        }
    },

    /**
    Description TODO
    @function
    */
    doAction: {
        enumerable: true,
        value: function(action, value) {
            // Check if the action is valid and enabled
            if (this._actions[action] && this._actions[action].enabled === true) {
                if (value === undefined) {
                    value = false;
                }
                document.execCommand("styleWithCSS", false, true);
                document.execCommand(action, false, value);
                document.execCommand("styleWithCSS", false, false);

                this.handleSelectionchange();
                this._markDirty();
            }
        }
    },


    // Element Resize methods
    /**
    Description TODO
    @private
    @function
    */
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
                handles,
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

    /**
    Description TODO
    @private
    @function
    */
    _removeResizer: {
        enumerable: true,
        value: function(element) {
            if (!element) {
                return;
            }
            var resizer = element.nextSibling;

            if (resizer && resizer.tagName === "DIV" && resizer.classList.contains("montage-resizer")) {
                element.parentNode.removeChild(resizer)
                element.classList.remove("montage-resizer-element");
            } else {
                // Handle case where the element has been removed from the DOM or the resizer is not in sync with the
                // element anymore (hapen after an undo)
                resizer = document.getElementById("montage-resizer");
                if (resizer && resizer.tagName === "DIV" && resizer.classList.contains("montage-resizer")) {
                    resizer.parentNode.removeChild(resizer);
                    return false;
                }
            }
            return true;
        }
    },


    // Private methods
    /**
    Description TODO
    @private
    @function
    */
    _dispatchEditorEvent: {
        enumerable: false,
        value: function(type, value) {
            var editorEvent = document.createEvent("CustomEvent");
            editorEvent.initCustomEvent(type, true, false, value === undefined ? null : value);
            editorEvent.type = type;
            this.dispatchEvent(editorEvent);
        }
    },

    /**
    Description TODO
    @private
    @function
    */
    _markDirty: {
        enumerable: false,
        value: function() {
            var thisRef = this,
                updateValues = function() {
                    clearTimeout(thisRef._forceUpdateValuesTimeout);
                    delete thisRef._forceUpdateValuesTimeout;
                    clearTimeout(thisRef._updateValuesTimeout);
                    delete thisRef._updateValuesTimeout;
                    thisRef.dispatchEvent(MutableEvent.changeEventForKeyAndValue("value" , thisRef.value));
                    thisRef.dispatchEvent(MutableEvent.changeEventForKeyAndValue("textValue" , thisRef.textValue));
                    thisRef._dispatchEditorEvent("editorChange");
                };

            // Clear the cached value
            this._dirtyValue = true;
            this._dirtyTextValue = true;

            if (!this._forceUpdateValuesTimeout) {
                this._forceUpdateValuesTimeout = setTimeout(updateValues, 1000);
            }
            if (this._updateValuesTimeout) {
                clearTimeout(this._updateValuesTimeout);
            }
            this._updateValuesTimeout = setTimeout(updateValues, 200);
        }
    },

    /**
    Description TODO
    @private
    @function
    */
    _delegateMethod: {
        enumerable: false,
        value: function(name) {
            var delegate, delegateFunctionName, delegateFunction;
            if (typeof this.identifier === "string") {
                delegateFunctionName = this.identifier + name.toCapitalized();
            } else {
                delegateFunctionName = name;
            }
            if ((delegate = this.delegate) && typeof (delegateFunction = delegate[delegateFunctionName]) === "function") {
                return delegateFunction;
            }

            return null;
        }
    },

    /**
    Description TODO
    @private
    @function
    */
    _nodeOffset: {
        enumerable: false,
        value: function(node) {
            var parentNode = node.parentNode,
                childNodes = parentNode.childNodes,
                i;

            for (i in childNodes) {
                if (childNodes[i] === node) {
                    return parseInt(i, 10); // i is a string, we need an integer
                }
            }
            return 0;
        }
    },

    /**
    Description TODO
    @private
    @function
    */
    _lastInnerNode: {
        enumerable: false,
        value: function() {
            var nodes = this.element.firstChild.childNodes,
                nbrNodes = nodes.length,
                node = null;

            while (nodes) {
                nbrNodes = nodes.length;
                if (nbrNodes) {
                    node = nodes[nbrNodes - 1];
                    nodes = node.childNodes;
                } else {
                    break;
                }
            }

            return node;
        }
    },

    /**
    Description TODO
    @private
    @function
    */
    _selectedRange: {
        enumerable: false,
        set: function(range) {
            if (window.getSelection) {
                var selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                range.select();
            }
        },

        get: function() {
            var userSelection,
                range;

            if (window.getSelection) {
                userSelection = window.getSelection();
            } else if (document.selection) { // Opera!
                userSelection = document.selection.createRange();
            }

            if (userSelection.getRangeAt) {
                if (userSelection.rangeCount) {
                    return userSelection.getRangeAt(0);
                } else {
                    // return an empty selection
                    return document.createRange();
                }
            }
            else { // Safari!
                var range = document.createRange();
                range.setStart(userSelection.anchorNode, userSelection.anchorOffset);
                range.setEnd(userSelection.focusNode, userSelection.focusOffset);
                return range;
            }
        }
    },

    _equalRange: {
        enumerable: false,
        value: function(rangeA, rangeB) {
            return (rangeA.startContainer == rangeB.startContainer &&
                rangeA.startOffset == rangeB.startOffset &&
                rangeA.endContainer == rangeB.endContainer &&
                rangeA.endOffset == rangeB.endOffset);
        }
    }
});
