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
/*global Element */
/**
	@module "montage/ui/rich-text-editor.reel"
    @requires montage/core/core
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    Sanitizer = require("./rich-text-sanitizer").Sanitizer,
    RichTextLinkPopup = require("../overlays/rich-text-linkpopup.reel").RichTextLinkPopup,
    RichTextResizer = require("../overlays/rich-text-resizer.reel").RichTextResizer,
    ChangeNotification = require("core/change-notification").ChangeNotification,
    Promise = require("core/promise").Promise,
    defaultUndoManager = require("core/undo-manager").defaultUndoManager;

/**
    @class module:"montage/ui/rich-text-editor.reel".RichTextEditorBase
    @extends module:montage/ui/component.Component
*/
exports.RichTextEditorBase = Montage.create(Component,/** @lends module:"montage/ui/rich-text-editor.reel".RichTextEditor# */ {
    /**
      Description TODO
      @private
    */
    _COMMANDS: {
        enumerable: false,
        value: null
    },

    /**
      Description TODO
      @private
    */
    COMMANDS: {
        enumerable: false,
        get: function() {
            if (!this._COMMANDS) {
                this._COMMANDS = [
                    {property: "bold"},
                    {property: "underline"},
                    {property: "italic"},
                    {property: "strikeThrough"},
                    {property: "baselineShift", method: this._baselineShiftGetState},
                    {property: "justify", method: this._justifyGetState},
                    {property: "listStyle", method: this._listStyleGetState},
                    {property: "fontName", method: this._fontNameGetState},
                    {property: "fontSize"},
                    {property: "backColor"},
                    {property: "foreColor"}
                ];
            }
            return this._COMMANDS;
        }
    },

    /**
      Description TODO
      @private
    */
    _overlays: {
        enumerable: false,
        value: undefined
    },

    /**
      Description TODO
      @private
    */
    _overlaySlot: {
        enumerable: false,
        value: null
    },

    /**
      Description TODO
      @private
    */
    _activeOverlay: {
        enumerable: false,
        value: null
    },

    /**
      Description TODO
      @private
    */
    _innerElement: {
        enumerable: false,
        value: null
    },

    /**
      Description TODO
      @private
    */
    _undoManager: {
        enumerable: false,
        value: undefined
    },

    /**
      Description TODO
      @private
    */
    _isTyping: {
        enumerable: false,
        value: false
    },

    /**
      Description TODO
      @private
    */
    _startTyping: {
        enumerable: false,
        value: function() {
            if (this._doingUndoRedo) {
                this._isTyping = false;
                return;
            } else if (!this._isTyping) {
                this._isTyping = true;
                if (this.undoManager) {
                    this.undoManager.register("Typing", Promise.resolve([this._undo, this, "Typing", this._innerElement]));
                }
            }
        }
    },

    /**
      Description TODO
      @private
    */
    _stopTyping: {
        enumerable: false,
        value: function() {
            if (this._isTyping) {
                this._isTyping = false;
            }
        }
    },

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
    _contentInitialized: {
        enumerable: false,
        value: false
    },

    /**
      Description TODO
      @private
    */
    _needsAssignOriginalContent: {
        enumerable: false,
        value: true
    },

    /**
      Description TODO
      @private
    */
    _needsAssingValue: {
        enumerable: false,
        value: false
    },

    /**
      Description TODO
      @private
    */
    _setCaretAtEndOfContent: {
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
      @private
    */
    _needsFocus: {
        value: false
    },

    /**
      Description TODO
      @private
    */
    _isActiveElement: {
        enumerable: false,
        value: false
    },

    /**
      Description TODO
      @private
    */
    _readOnly: {
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
      @private
    */
    _textValue: {
        enumerable: false,
        value: ""
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
    _sanitizer: {
        enumerable: false,
        value: undefined
    },

    /**
      Description TODO
      @private
    */
    _allowDrop: {
        enumerable: false,
        value: true
    },

    // Commands Helpers
    _getState: {
        value: function(property, command) {
            var state,
                savedActiveElement = document.activeElement,
                editorElement = this._innerElement;

            if (editorElement && !this["_" + property + "_locked"]) {

                // Make sure we are the active element before calling execCommand
                if (editorElement && editorElement != savedActiveElement) {
                    editorElement.focus();
                }

                state = document.queryCommandValue(command);
                // Convert string to boolean
                if (state == "true") {
                    state = true;
                } if (state == "false") {
                    state = false;
                }

                // Reset the focus
                if (editorElement && editorElement != savedActiveElement) {
                    savedActiveElement.focus();
                }

                return state;
            } else {
               return this["_" + property];
            }
        }
    },

    _genericCommandGetter : {
        value: function(property, command) {
            var propertyName = "_" + property;
            this[propertyName] = this._getState(property, command);
            return this[propertyName];
        }
    },

    _genericCommandSetter : {
        value: function(property, command, value) {
            var state = this._getState(property, command); // Make sure the state is up-to-date
            if (state !== value) {
                this.doAction(command, typeof value == "boolean" ? false : value);
            }
        }
    },

    // Edit Actions & Properties
    /**
      Description TODO
      @private
    */
    _bold: { value: false },

    /**
      Description TODO
      @private
    */
    _underline: { value: false },

    /**
      Description TODO
      @private
    */
    _italic: { value: false },

    /**
      Description TODO
      @private
    */
    _strikeThrough: { value: false },

    /**
      Description TODO
      @private
    */
    _baselineShiftGetState: {
        enumerable: false,
        value: function() {
            var savedActiveElement = document.activeElement,
            editorElement = this._innerElement;

            if (editorElement && !this._baselineShift_locked) {
                 // Make sure we are the active element before calling execCommand
                if (editorElement != savedActiveElement) {
                    editorElement.focus();
                }

                if (this._getState("baselineShift", "subscript")) {
                   return "subscript"
                } else if (this._getState("baselineShift", "superscript")) {
                    return "superscript"
                } else {
                    return "baseline";     // default
                }

                 // Reset the focus
                if (editorElement != savedActiveElement) {
                    savedActiveElement.focus();
                }
            } else {
                return this._baselineShift;
            }
        }
    },

    /**
      Description TODO
      @private
    */
    _baselineShift: { value: "baseline" },

    /**
      Description TODO
      @private
    */
    _listStyleGetState: {
        enumerable: false,
        value: function() {
            var savedActiveElement = document.activeElement,
            editorElement = this._innerElement;

            if (editorElement && !this._listStyle_locked) {
                // Make sure we are the active element before calling execCommand
                if (editorElement != savedActiveElement) {
                    editorElement.focus();
                }

                if (this._getState("listStyle", "insertorderedlist")) {
                   return "ordered"
                } else if (this._getState("listStyle", "insertunorderedlist")) {
                    return "unordered"
                } else {
                    return "none";     // default
                }

                 // Reset the focus
                if (editorElement != savedActiveElement) {
                    savedActiveElement.focus();
                }
            } else {
                return this._listStyle;
            }
        }
    },
    /**
      Description TODO
      @private
    */
    _listStyle: { value: "none" },

    /**
      Description TODO
      @private
    */
    _justifyGetState: {
        enumerable: false,
        value: function() {
            var savedActiveElement = document.activeElement,
            editorElement = this._innerElement;

            if (editorElement && !this._justify_locked) {
                // Make sure we are the active element before calling execCommand
                if (editorElement != savedActiveElement) {
                    editorElement.focus();
                }

                if (this._getState("justify", "justifyleft")) {
                   return "left"
                } else if (this._getState("justify", "justifycenter")) {
                    return "center"
                } else if (this._getState("justify", "justifyright")) {
                    return "right"
                } else if (this._getState("justify", "justifyfull")) {
                    return "full"
                } else {
                    return "left";     // default
                }

                // Reset the focus
                if (editorElement != savedActiveElement) {
                    savedActiveElement.focus();
                }
            } else {
                return this._justify;
            }
        }
    },

    /**
      Description TODO
      @private
    */
    _justify: { value: "left" },

    /**
      Description TODO
      @private
    */
    _fontNameGetState: {
        enumerable: false,
        value: function() {
            var fontName = this._getState("fontName", "fontname");
            if (fontName) {
                fontName = fontName.replace(/\"|\'/g, "");
            }

            return fontName;
        }
    },
    /**
      Description TODO
      @private
    */
    _fontName: { value: "" },

    /**
      Description TODO
      @private
    */
    _fontSize: { value: 0 },

    /**
      Description TODO
      @private
    */
    _backColor: { value: "" },

    /**
      Description TODO
      @private
    */
    _foreColor: { value: "" },

    /**
      Description TODO
     @type {Function}
    */
    _updateStates: {
        enumerable: true,
        value: function() {
            var thisRef = this,
                command,
                commandName,
                propertyName,
                state,
                prevState,
                method,
                descriptor,
                i;

            var COMMANDS = this.COMMANDS;
            var numCommands = COMMANDS.length;
            for (i = 0; i < numCommands; i ++) {
                command = COMMANDS[i];

                if (typeof command == "object") {
                    propertyName = command.property;
                    commandName = command.name || propertyName.toLowerCase();
                    method = command.method || this._getState;
                } else {
                    continue;
                }

                descriptor = ChangeNotification.getPropertyChangeDescriptor(this, propertyName);
                if (descriptor) {
                    prevState = this["_" + propertyName];
                    state = method.call(this, propertyName, commandName);
                    if (state !== prevState) {
                        this["_" + propertyName + "_locked"] = true;
                        this.dispatchPropertyChange(propertyName, function() {
                            thisRef["_" + propertyName] = state;
                        });
                        thisRef["_" + propertyName + "_locked"] = false;
                    }
                }
            }
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
            var el = this.element;

            el.classList.add('montage-Editor-container');

            el.addEventListener("focus", this, true);
            el.addEventListener("dragstart", this, false);
            el.addEventListener("dragenter", this, false);
            el.addEventListener("dragover", this, false);
            el.addEventListener("drop", this, false);
            el.addEventListener("dragend", this, false);

             // Setup the sanitizer if not specified
            if (this._sanitizer === undefined) {
                this._sanitizer = Sanitizer.create();
            }

            // Setup the undoManager if not specified
            if (this._undoManager === undefined) {
                this._undoManager = defaultUndoManager;
            }

            // Initialize the overlays
            if (this._overlays === undefined) {
                // Install the default overlays
                this._overlays = [RichTextResizer.create(), RichTextLinkPopup.create()];
            }
            this._callOverlays("initWithEditor", this, true);
        }
    },

    /**
    Description TODO
    @function
    */
    draw: {
        enumerable: false,
        value: function() {
            var editorElement = this.element,
                editorInnerElement,
                contents,
                content,
                contentChanged,
                prevValue,
                descriptor,
                i;

            if (this._needsAssingValue || this._needsAssignOriginalContent) {
                editorInnerElement = this._innerElement = editorElement.querySelector(".montage-Editor");

                if (this._contentInitialized) {
                    // if the content has been already initialized, we need replace it by a clone of itself
                    // in order to reset the browser undo stack
                    editorElement.replaceChild(editorInnerElement.cloneNode(true), editorInnerElement);
                    editorInnerElement = this._innerElement = editorElement.querySelector(".montage-Editor");

                    //JFD TODO: Need to clear entries in the Montage undoManager queue
                }

                editorInnerElement.setAttribute("contenteditable", (this._readOnly ? "false" : "true"));
                editorInnerElement.classList.add("editor-" + this._uniqueId);
                editorInnerElement.innerHTML = "";

                if (this._needsAssingValue) {
                    // Set the contentEditable value
                    if (this._value && !this._dirtyValue) {
                        editorInnerElement.innerHTML = this._value;
                    } else if (this._textValue && !this._dirtyTextValue) {
                        if (editorInnerElement.innerText) {
                            editorInnerElement.innerText = this._textValue;
                        } else {
                            editorInnerElement.textContent = this._textValue;
                        }
                    }
                } else if (this._needsAssignOriginalContent) {
                    contents = this.originalContent;
                    contentChanged = false;
                    if (contents instanceof Element) {
                        editorInnerElement.appendChild(contents);
                        contentChanged = true;
                    } else {
                        for (i = 0; contents && (content = contents[i]); i++) {
                            editorInnerElement.appendChild(content);
                            contentChanged = true;
                        }
                    }
                    if (contentChanged) {
                        // Clear the cached value in order to force an editorChange event
                        this._dirtyValue = true;
                        this._dirtyTextValue = true;
                    }
                }

                this._adjustPadding();
                this.markDirty();

                this._needsAssingValue = false;
                this._needsAssignOriginalContent = false;
                this._contentInitialized = true;

                this._setCaretAtEndOfContent = true;
                if (this.hasFocus) {
                    // Call focus to move caret to end of document
                    this.focus();
                }

            } else {
                editorInnerElement = this._innerElement;
            }

            if (this._readOnly) {
                editorInnerElement.setAttribute("contentEditable", "false");
                editorElement.classList.add("readonly")
            } else {
                editorInnerElement.setAttribute("contentEditable", "true");
                editorElement.classList.remove("readonly")
            }
        }
    },

    /**
    Description TODO
    @function
    */
    didDraw: {
        value: function() {
            if (this._needsFocus) {
                this._innerElement.focus();
                if(document.activeElement == this._innerElement) {
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
    slotDidSwitchContent: {
        enumerable: false,
        value: function(substitution, nodeShown, componentShown, nodeHidden, componentHidden) {
            if(componentHidden && typeof componentHidden.didBecomeInactive === 'function') {
                componentHidden.didBecomeInactive();
            }
            if(componentShown && typeof componentShown.didBecomeActive === 'function') {
                componentShown.didBecomeActive();
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
            var el = this._innerElement,
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
    captureFocus: {
        enumerable: false,
        value: function() {
            var thisRef = this,
                el = this.element,
                content = this._innerElement,
                isActive,
                savedRange,
                timer;

            this.dispatchPropertyChange("hasFocus", function() {
                thisRef._hasFocus = true;
            });
            isActive = (content && content === document.activeElement);
            if (isActive != this._isActiveElement) {
                this.dispatchPropertyChange("isActiveElement", function() {
                    thisRef._isActiveElement = isActive;
                });
            }

            if (this._setCaretAtEndOfContent) {
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
                timer = setInterval(function() {
                    if (thisRef._equalRange(thisRef._selectedRange, savedRange) &&
                            content.scrollTop + content.offsetHeight != content.scrollHeight) {
                        content.scrollTop = content.scrollHeight - content.offsetHeight;
                    }
                }, 10);

                setTimeout(function(){clearInterval(timer)}, 1000);

                this._setCaretAtEndOfContent = false;
            }

            el.addEventListener("blur", this, true);
            el.addEventListener("input", this);
            el.addEventListener("keydown", this);
            el.addEventListener("keypress", this);
            el.addEventListener("cut", this);
            el.addEventListener("paste", this);
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

            // Turn off image resize (if supported) as we provide our own
            document.execCommand("enableObjectResizing", false, false);
            // Force use css for styling (if supported)
            document.execCommand("styleWithCSS", false, true);

            // Update the states now that we have focus
            this._updateStates();
        }
    },

    /**
    Description TODO
    @function
    */
    captureBlur: {
        enumerable: false,
        value: function() {
            var thisRef = this,
                el = this.element,
                content = this._innerElement,
                isActive;

            this.dispatchPropertyChange("hasFocus", function() {
                thisRef._hasFocus = false;
            });
            isActive = (content && content === document.activeElement);
            if (isActive != this._isActiveElement) {
                this.dispatchPropertyChange("isActiveElement", function() {
                    thisRef._isActiveElement = isActive;
                });
            }

            // As we lost focus, we need to prevent the selection change timer to fired, else it will cause the RTE to regain focus
            if (this._selectionChangeTimer) {
                clearTimeout(this._selectionChangeTimer);
            }

            el.removeEventListener("blur", this, true);
            el.removeEventListener("input", this);
            el.removeEventListener("keydown", this);
            el.removeEventListener("keypress", this);
            el.removeEventListener("cut", this);
            el.removeEventListener("paste", this);
            el.removeEventListener(window.Touch ? "touchstart" : "mousedown", this);
            document.removeEventListener(window.Touch ? "touchend" : "mouseup", this);

            document.removeEventListener("selectionchange", this);

            if (this._hasSelectionChangeEvent === false) {
                el.removeEventListener("keydup", this);
            }
        }
    },

    /**
    Description TODO
    @function
    */
    handleKeydown: {
        enumerable: false,
        value: function(event) {
            if (["Left", "Right", "Up", "Down", "Home", "End"].indexOf(event.keyIdentifier) != -1) {
                this._stopTyping();
            }
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

            this.markDirty();
        }
    },

    /**
    Description TODO
    @function
    */
    handleInput: {
        enumerable: false,
        value: function(event) {
            if (!this._executingCommand && !this._ignoreNextInputEvent) {
                this._startTyping();
            }
            delete this._ignoreNextInputEvent;

            if (this._hasSelectionChangeEvent === false) {
                this.handleSelectionchange();
            }

            this.handleDragend(event);
            this.markDirty();
        }
    },

    /**
    Description TODO
    @function
    */
    handleShortcut: {
        enumerable: false,
        value: function(event, action) {
            this.doAction(action);
            return true;
        }
    },

    /**
    Description TODO
    @function
    */
    handleMousedown: {
        enumerable: false,
        value: function(event) {
            this._savedSelection = this._selectedRange;
            this._callOverlays(event.type == "mousedown" ? "editorMouseDown" : "editorTouchStart", event);
        }
    },

    /**
    Description TODO
    @function
    */
    handleMouseup: {
        enumerable: false,
        value: function(event) {
            if (!this._equalRange(this._savedSelection, this._selectedRange)) {
                this._stopTyping();
            }

            if (this._hasSelectionChangeEvent === false) {
                this.handleSelectionchange();
            }
            this.handleDragend(event);

            this._callOverlays(event.type == "mouseup" ? "editorMouseUp" : "editorTouchEnd", event);
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

            if (this._hasSelectionChangeEvent == null) {
                this._hasSelectionChangeEvent = true;
            }

            if (this._ignoreSelectionchange || this._equalRange(this._selectedRange, this._savedSelectedRange)) {
                // no change, ignore
                return;
            }
            this._savedSelectedRange = this._selectedRange;

            if (this._selectionChangeTimer) {
                clearTimeout(this._selectionChangeTimer);
            }
            this._selectionChangeTimer = setTimeout(function() {
                thisRef._updateStates();
                thisRef._dispatchEditorEvent("editorSelect");
            }, 100);

            this._callOverlays("editorSelectionDidChange", this._savedSelectedRange);
        }
    },

    /**
    Description TODO
    @function
    */
    handleDragstart: {
        enumerable: false,
        value: function(event) {
            var delegateMethod = this._delegateMethod("canDrag");

            if (delegateMethod) {
               if (!delegateMethod.call(this.delegate, this, event.srcElement)) {
                   event.preventDefault();
                   event.stopPropagation();

                   return;
               }
            }

            // let's remember which element we are dragging
            this._dragSourceElement = event.srcElement;
        }
    },

    /**
    Description TODO
    @function
    */
    handleDragenter: {
        enumerable: false,
        value: function(event) {

            this.hideOverlay();

            var delegateMethod = this._delegateMethod("canDrop");
            if (delegateMethod) {
                this._allowDrop = delegateMethod.call(this.delegate, this, event, this._dragSourceElement);
            } else {
                this._allowDrop = true;
            }

            event.dataTransfer.dropEffect = this._allowDrop ? "copy" : "none";
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
            var thisRef = this,
                range;

            // If we are moving an element from within the ourselves, let the browser deal with it...
            if (this._dragSourceElement && this._allowDrop) {
                return;
            }

            event.dataTransfer.dropEffect = this._allowDrop ? "copy" : "none";

            event.preventDefault();
            event.stopPropagation();

            // Update the caret
            if (this._allowDrop && (event.x !== this._dragOverX || event.y !== this._dragOverY)) {
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
                if (this._ignoreSelectionchangeTimer) {
                    clearTimeout(this._ignoreSelectionchangeTimer)
                }
                this._ignoreSelectionchangeTimer = setTimeout(function(){
                    delete thisRef._ignoreSelectionchange;
                    thisRef._ignoreSelectionchangeTimer = null;
                }, 0);
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
            var thisRef = this,
                files = event.dataTransfer.files,
                fileLength = files.length,
                file,
                data,
                reader,
                i,
                delegateMethod,
                response;

            if (this._dragSourceElement) {
                // Let the browser do the job for us, just make sure we cleanup after us

                this._stopTyping();
                if (this.undoManager) {
                    this.undoManager.register("Move", Promise.resolve([this._undo, this, "Move", this._innerElement]));
                }
                this._ignoreNextInputEvent = true;

                this.handleDragend(event);
                this.handleSelectionchange();
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            if (fileLength) {
                for (i = 0; i < fileLength; i ++) {
                    file = files[i];
                    delegateMethod = this._delegateMethod("shouldDropFile");
                    response = true;

                    if (window.FileReader) {
                        reader = new FileReader();
                        reader.onload = function() {
                            data = reader.result;

                            if (delegateMethod) {
                                response = delegateMethod.call(thisRef.delegate, thisRef, file, data);
                            }
                            if (response === true) {
                                if (file.type.match(/^image\//i)) {
                                    thisRef.execCommand("insertimage", false, data, "Drop");
                                    thisRef.markDirty();
                                }
                            } else if (typeof response == "string") {
                                thisRef.execCommand("inserthtml", false, response, "Drop");
                                thisRef.markDirty();
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
                        if (typeof response == "string") {
                            thisRef.execCommand("inserthtml", false, response, "Drop");
                            thisRef.markDirty();
                        }
                    }
                }
            } else {
                data = event.dataTransfer.getData("text/html");
                if (data) {
                    // Sanitize Fragment (CSS & JS)
                    if (this._sanitizer) {
                        data = this._sanitizer.willInsertHtmlData(data, this._uniqueId);
                    }
                } else {
                    data = event.dataTransfer.getData("text/plain") || event.dataTransfer.getData("text");
                    if (data) {
                        var div = document.createElement('div');
                        if (div.innerText) {
                            div.innerText = data;
                        } else {
                            div.textContent = data;
                        }
                        data = div.innerHTML;
                    }
                }
                if (data) {
                    var delegateMethod = this._delegateMethod("shouldDrop"),
                        response;

                    if (delegateMethod) {
                        response = delegateMethod.call(this.delegate, this, event, data, "text/html");
                        if (response === true) {
                            data = data.replace(/\<meta [^>]+>/gi, ""); // Remove the meta tag.
                        } else {
                            data = response === false ? null : response ;
                        }
                    } else {
                        data = data.replace(/\<meta [^>]+>/gi, ""); // Remove the meta tag.
                    }
                    if (data && data.length) {
                        this.execCommand("inserthtml", false, data, "Drop");
                        this.markDirty();
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
    handleCut: {
        enumerable: false,
        value: function(event) {
            this._stopTyping()
            if (this.undoManager) {
                this.undoManager.register("Cut", Promise.resolve([this._undo, this, "Cut", this._innerElement]));
            }
            this._ignoreNextInputEvent = true;
        }
    },



    /**
    Description TODO
    @function
    */
    handlePaste: {
        enumerable: false,
        value: function(event) {
            var thisRef = this,
                clipboardData = event.clipboardData,
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
            isHTML = data && data.match(/^(<meta [^>]*>|<html>)/i);
            if (data && isHTML) {
                // Sanitize Fragment (CSS & JS)
                if (this._sanitizer) {
                    data = this._sanitizer.willInsertHtmlData(data, this._uniqueId);
                }
            } else {
                data = clipboardData.getData("text/plain") ||  clipboardData.getData("text");
                if (data) {
                    // Convert plain text to html
                    div = document.createElement('div');
                    if (div.innerText) {
                        div.innerText = data;
                    } else {
                        div.textContent = data;
                    }
                    data = div.innerHTML;
                }
            }

            if (data) {
                delegateMethod = this._delegateMethod("shouldPaste");
                if (delegateMethod) {
                    response = delegateMethod.call(this.delegate, this, event, data, "text/html");
                    if (response === true) {
                        data = data.replace(/\<meta [^>]+>/gi, ""); // Remove the meta tag.
                    } else {
                        data = response === false ? null : response ;
                    }
                } else {
                    data = data.replace(/\<meta [^>]+>/gi, ""); // Remove the meta tag.
                }
                if (data && data.length) {
                    this.execCommand("inserthtml", false, data, "Paste");
                    this.markDirty();
                }
            } else {
                // Maybe we have trying to paste an image as Blob...
                if (clipboardData.items.length) {
                    item = clipboardData.items[0];
                    if (item.kind == "file" && item.type.match(/^image\/.*$/)) {
                        file = item.getAsFile();

                        response = true;
                        delegateMethod = thisRef._delegateMethod("shouldPasteFile");

                        if (window.FileReader) {
                            reader = new FileReader();
                            reader.onload = function() {
                                data = reader.result;

                                if (delegateMethod) {
                                    response = delegateMethod.call(thisRef.delegate, thisRef, file, data);
                                }
                                if (response === true) {
                                    if (file.type.match(/^image\//i)) {
                                        thisRef.execCommand("insertimage", false, data, "Paste");
                                        thisRef.markDirty();
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
            this.execCommand(action, false, value);

            // Force an update states right away
            this._updateStates();
        }
    },


    _undo: {
        enumerable: false,
        value: function(label, element) {
            var editorElement = this._innerElement;
            if (!element || element === editorElement) {
                this._doingUndoRedo = true;
                this._ignoreNextInputEvent = true;
                document.execCommand("undo", false, null);
                this.markDirty();
                if (this.undoManager) {
                    this.undoManager.register(label, Promise.resolve([this._redo, this, label, editorElement]));
                }
                this._doingUndoRedo = false;
            }
        }
    },

    /**
    Description TODO
    @function
    */
    _redo: {
        enumerable: false,
        value: function(label, element) {
            var editorElement = this._innerElement;
            if (!element || element === editorElement) {
                this._doingUndoRedo = true;
                this._ignoreNextInputEvent = true;
                document.execCommand("redo", false, null);
                this.markDirty();
                if (this.undoManager) {
                    this.undoManager.register(label, Promise.resolve([this._undo, this, label, editorElement]));
                }
                this._doingUndoRedo = false;
            }
        }
    },

    // Private methods

    /**
    Description TODO
    @function
    */
    _execCommandLabel : {
        enumerable: false,
        value: {
            bold: "Bold", italic: "Italic", underline: "Underline", strikethrough: "strikeThrough",
            subscript: "Subscript", superscript: "Superscript",
            indent: "Indent", outdent: "Outdent", insertorderedlist: "Ordered List", insertunorderedlist: "Unordered List",
            justifyleft: "Left Align", justifycenter: "Center", justifyright: "Right Align", justifyfull: "Justify",
            fontname: "Set Font", fontsize: "Set Size",
            forecolor: "Set Color", backcolor: "Set Color"
        }
    },

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

    _callOverlays: {
        value: function(method, param, forceCallAll) {
            var i,
                activeOverlay = this._activeOverlay,
                overlay;

            // Call the active overlay first
            if (activeOverlay) {
                if (typeof activeOverlay[method] == "function") {
                    if (activeOverlay[method](param)) {
                        if (!forceCallAll) {
                            return true;
                        }
                    }
                }
            }

            // Then the other overlays
            for (i in this._overlays) {
                overlay = this._overlays[i];
                if (overlay !== activeOverlay) {
                    if (typeof overlay[method] == "function") {
                        if (overlay[method](param)) {
                            if (!forceCallAll) {
                                return true;
                            }
                        }
                    }
                }
            }

            return false;
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
            return -1;
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
            var nodes = this._innerElement.childNodes,
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

    /**
    Description TODO
    @private
    @function
    */
    _equalRange: {
        enumerable: false,
        value: function(rangeA, rangeB) {
            if (rangeA === rangeB) {
                return true;
            }
            if (!rangeA || !rangeB) {
                return false;
            }
            return (rangeA.startContainer == rangeB.startContainer &&
                rangeA.startOffset == rangeB.startOffset &&
                rangeA.endContainer == rangeB.endContainer &&
                rangeA.endOffset == rangeB.endOffset);
        }
    },

    _innerText: {
        enumerable: false,
        value: function(contentNode) {
            var result = "",
                textNodeContents = [],
                newLines = "",
                gotText = false,
                _walkNode = function(node) {
                    var nodeName = node.nodeName,
                        child

                    if (nodeName.match(/^(TITLE|STYLE|SCRIPT)$/)) {
                        return;
                    }

                    if (gotText && nodeName.match(/^(P|DIV|BR|TR|LI)$/)) {
                        newLines += "\n";
                    }

                    for (child = node.firstChild; child; child = child.nextSibling) {
                        if (child.nodeType == 3) {      // text node
                            textNodeContents.push(newLines + child.nodeValue);
                            newLines = "";
                            gotText = true;
                        } else {
                            if (child.nodeName != "BR" || child.nextSibling) {
                                _walkNode(child);
                            }
                        }
                    }

                    if (gotText && nodeName.match(/^(TABLE|UL|OL)$/)) {
                        newLines += "\n";
                    }
                };

            if (contentNode) {
                _walkNode(contentNode);
                result = textNodeContents.join("");
            }

            return result;
        }
    }
});
