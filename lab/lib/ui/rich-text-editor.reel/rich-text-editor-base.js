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
    ActiveLinkBox = require("./rich-text-activelink-box.js").ActiveLinkBox,
    Resizer = require("./rich-text-resizer").Resizer,
    defaultEventManager = require("core/event/event-manager").defaultEventManager;

/**
    @class module:"montage/ui/rich-text-editor.reel".RichTextEditorBase
    @extends module:montage/ui/component.Component
*/
exports.RichTextEditorBase = Montage.create(Component,/** @lends module:"montage/ui/rich-text-editor.reel".RichTextEditor# */ {

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
    _needsSelectionReset: {
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
    _needsActiveLinkOn: {
        enumerable: false,
        value: false
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
        value: Sanitizer.create()
    },

    /**
      Description TODO
      @private
    */
    _activeLinkBox: {
        enumerable: false,
        value: ActiveLinkBox.create()
    },

    /**
      Description TODO
      @private
    */
    _resizer: {
        enumerable: false,
        value: Resizer.create()
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
        value: function(key) {
            var state;

            if (this.element.firstChild == document.activeElement) {
                state = document.queryCommandValue(key);
                // Convert string to boolean
                if (state == "true") {
                    state = true;
                } if (state == "false") {
                    state = false;
                }
                return state;
            } else {
                return this["_" + key];
            }
        }
    },

    _genericCommandGetter : {
        value: function(key) {
            var propertyName = "_" + key;
            this[propertyName] = this._getState(key);
            return this[propertyName];
        }
    },

    _genericCommandSetter : {
        value: function(key, value) {
            var state = this._getState(key); // Make sure the state is up-to-date
            if (state !== value) {
                this.doAction(key, typeof value == "boolean" ? false : value);
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
    _strikethrough: { value: false },

    /**
      Description TODO
      @private
    */
    _subscript: { value: false },

    /**
      Description TODO
      @private
    */
    _superscript: { value: false },

    /**
      Description TODO
      @private
    */
    _liststyleGetState: {
        enumerable: false,
        value: function() {
            if (this.element.firstChild == document.activeElement) {
                if (this._getState("insertorderedlist")) {
                   return "ordered"
                } else if (this._getState("insertunorderedlist")) {
                    return "unordered"
                } else {
                    return "none";     // default
                }
            } else {
                return this._liststyle;
            }
        }
    },
    /**
      Description TODO
      @private
    */
    _liststyle: { value: "none" },

    /**
      Description TODO
      @private
    */
    _justifyGetState: {
        enumerable: false,
        value: function() {
            if (this.element.firstChild == document.activeElement) {
                if (this._getState("justifyleft")) {
                   return "left"
                } else if (this._getState("justifycenter")) {
                    return "center"
                } else if (this._getState("justifyright")) {
                    return "right"
                } else if (this._getState("justifyfull")) {
                    return "full"
                } else {
                    return "left";     // default
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
    _fontnameGetState: {
        enumerable: false,
        value: function() {
            this._fontname = this._getState("fontname");
            if (this._fontname) {
                this._fontname = this._fontname.replace(/\"|\'/g, "");
            }

            return this._fontname;
        }
    },
    /**
      Description TODO
      @private
    */
    _fontname: { value: "" },

    /**
      Description TODO
      @private
    */
    _fontsize: { value: 0 },

    /**
      Description TODO
      @private
    */
    _backcolor: { value: "" },

    /**
      Description TODO
      @private
    */
    _forecolor: { value: "" },


    // Component Callbacks
    /**
    Description TODO
    @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {
            var el = this.element;

            if (this._activeLinkBox) {
                this._activeLinkBox.initialize(this);
            }
            if (this._resizer) {
                this._resizer.initialize(this);
            }

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
                editorInnerElement,
                element,
                range,
                offset,
                prevValue;

            if (this._needsResetContent === true) {
                // Reset the editor content in order to reset the browser undo stack
                editorElement.innerHTML = '<div class="montage-editor editor-' + this._uniqueId + '" contentEditable="'
                    + (this._readOnly ? 'false' : 'true')+'"></div>';
                editorInnerElement = editorElement.firstChild;

                // Set the contentEditable value
                if (this._value && !this._dirtyValue) {
                    editorInnerElement.innerHTML = this._value;
                    // Since this property affects the textValue, we need to fire a change event for it as well
                    if (defaultEventManager.registeredEventListenersForEventType_onTarget_("change@textValue", this)) {
                        prevValue = this._textValue;
                        if (this.textValue !== prevValue) {
                            this.dispatchEvent(MutableEvent.changeEventForKeyAndValue("textValue" , prevValue).withPlusValue(text.value));
                        }
                    }
                } else if (this._textValue && !this._dirtyTextValue) {
                    if (editorInnerElement.innerText) {
                        editorInnerElement.innerText = this._textValue;
                    } else {
                        editorInnerElement.textContent = this._textValue;
                    }
                    // Since this property affects the value, we need to fire a change event for it as well
                    if (defaultEventManager.registeredEventListenersForEventType_onTarget_("change@value", this)) {
                        prevValue = this._value;
                        if (this.value !== prevValue) {
                            this.dispatchEvent(MutableEvent.changeEventForKeyAndValue("value" , prevValue).withPlusValue(this.value));
                        }
                    }
                } else {
                    editorInnerElement.innerHTML = "";
                }

                this._adjustPadding();
                this._markDirty();
                delete this._needsResetContent;
            } else {
                editorInnerElement = editorElement.firstChild;
            }

            if (this._readOnly) {
                editorInnerElement.setAttribute("contentEditable", "false");
                editorElement.classList.add("readonly")
            } else {
                editorInnerElement.setAttribute("contentEditable", "true");
                editorElement.classList.remove("readonly")
            }

            if (this._resizer) {
                // Need to hide the resizer?
                if (this._needsHideResizer) {
                    this._resizer.hide();
                    delete this._needsHideResizer;
                }

                // Need to show the resizer?
                if (this._needsShowResizerOn) {
                    element = this._needsShowResizerOn;
                    this._resizer.show(element);

                    // Select the element and its resizer
                    this._selectingResizer = true;
                    offset = this._nodeOffset(element);
                    range = document.createRange();
                    range.setStart(element.parentNode, offset);
                    range.setEnd(element.parentNode, offset + 1);
                    this._selectedRange = range;

                    // Note: Chrome (and maybe other browsers) will fire 2 selectionchange event asynchronously, to work around it let's use a timer
                    setTimeout(function() {delete thisRef._selectingResizer;}, 0);

                    delete this._needsShowResizerOn;
                }

                // Let's give a change to the resizer to do any custom drawing if needed
                this._resizer.draw();
            }

            if (this._activeLinkBox) {
                if (this._needsActiveLinkOn !== false && this._needsActiveLinkOn != this._activeLinkBox.activeLink)
                {
                    this._activeLinkBox.show(this._needsActiveLinkOn);
                    this._needsActiveLinkOn = false;
                } else {
                    this._needsActiveLinkOn = false;
                }
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
                isActive,
                savedRange,
                timer;

            this._hasFocus = true;
            this.dispatchEvent(MutableEvent.changeEventForKeyAndValue("hasFocus" , false).withPlusValue(true));
            isActive = (content && content === document.activeElement);
            if (isActive != this._isActiveElement) {
                this._isActiveElement = isActive;
                this.dispatchEvent(MutableEvent.changeEventForKeyAndValue("isActiveElement" , false).withPlusValue(true));
            }

            if (this._needsSelectionReset) {
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

                this._needsSelectionReset = false;
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

            // Turn off image resize (if supported) as we provide our own
            document.execCommand("enableObjectResizing", false, false);
            // Force use css for styling (if supported)
            document.execCommand("styleWithCSS", false, true);

            // Update the states now that we have focus
            this.updateStates();
        }
    },

    /**
    Description TODO
    @function
    */
    handleBlur: {
        enumerable: false,
        value: function() {
            var el = this.element,
                content = el.firstChild,
                isActive;

            this._hasFocus = false;
            this.dispatchEvent(MutableEvent.changeEventForKeyAndValue("hasFocus" , true).withPlusValue(false));
            isActive = (content && content === document.activeElement);
            if (isActive != this._isActiveElement) {
                this._isActiveElement = isActive;
                this.dispatchEvent(MutableEvent.changeEventForKeyAndValue("isActiveElement" , !isActive).withPlusValue(isActive));
            }

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

            if (this._activeLinkBox && this._activeLinkBox.activeLink) {
                this._activeLinkBox.hide();
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
            if (this._hasSelectionChangeEvent === false) {
                this.handleSelectionchange();
            }

            if (this._activeLinkBox && this._activeLinkBox.activeLink) {
                this._activeLinkBox.hide();
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
            if (this._resizer) {
                if (this.resizer.startUserAction(event)) {
                    event.preventDefault();
                    event.stopPropagation();

                    return;
                }
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

            if (this._resizer) {
                if (this.resizer.endUserAction(event)) {
                    event.preventDefault();
                    event.stopPropagation();

                    return;
                }
            }

            if (element.tagName === "IMG") {
                if (this._currentResizerElement !== element) {
                    this._needsShowResizerOn = element;
                    this.needsDraw = true;
                }
            } else {
                if (this._resizer && this._resizer.element) {
                    this._needsHideResizer = true;
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
            var thisRef = this,
                range,
                element,
                hideLinkPopup = true;

            if (this._ignoreSelectionchange) {
                return;
            }

            if (this._hasSelectionChangeEvent == null) {
                this._hasSelectionChangeEvent = true;
            }

            if (this._resizer) {
                if (this._selectingResizer !== true && this._resizer.element) {
                    this._needsHideResizer = true;
                    this.needsDraw = true;
                }
            }

            if (this._activeLinkBox) {
                //Check if we are inside an anchor
                range = this._selectedRange;
                if (range && range.collapsed) {
                    element = range.commonAncestorContainer;
                    while (element && element != this._element) {
                        if (element.nodeName == "A") {
                            hideLinkPopup = false;
                            if (element != this._activeLink) {
                                this._needsActiveLinkOn = element;
                                this.needsDraw = true;
                            }
                            break;
                        }
                        element = element.parentElement;
                    }
                }
                if (hideLinkPopup) {
                    this._needsActiveLinkOn = null;
                    this.needsDraw = true;
                }
            }

            if (this._selectionChangeTimer) {
                clearTimeout(this._selectionChangeTimer);
            }
            this._selectionChangeTimer = setTimeout(function() {
                thisRef.updateStates();
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
            var thisRef = this,
                range;

            // If we are moving an element from within the ourselves, let the browser deal with it...
            if (this._dragSourceElement) {
                return;
            }

            // JFD TODO: check if drop type is acceptable...
            event.dataTransfer.dropEffect = this._allowDrop ? "copy" : "none";

            event.preventDefault();
            event.stopPropagation();

            // Remove the link popup
            if (this._activeLinkBox && this._needsActiveLinkOn === false && this._activeLinkBox.activeLink) {
                this._needsActiveLinkOn = null;
                this.needsDraw = true;
            }

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
                                response = delegateMethod.call(thisRef.delegate, thisRef, file, data);
                            }
                            if (response === true) {
                                if (file.type.match(/^image\//i)) {
                                    document.execCommand("insertimage", false, data);
                                    thisRef._markDirty();
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
                        data = this._sanitizer.willInsertHTMLData(data, this._uniqueId);
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
                    data = this._sanitizer.willInsertHTMLData(data, this._uniqueId);
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

                                thisRef._delegateMethod("filePaste");
                                if (delegateMethod) {
                                    response = delegateMethod.call(thisRef.delegate, thisRef, file, data);
                                }
                                if (response === true) {
                                    if (file.type.match(/^image\//i)) {
                                        document.execCommand("insertimage", false, data);
                                        thisRef._markDirty();
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
            var savedActiveElement = document.activeElement,
                editorElement = this.element.firstChild;

            if (!editorElement) {
                return;
            }

            // Make sure we are the active element before calling execCommand
            if (editorElement != savedActiveElement) {
                editorElement.focus();
            }

            if (value === undefined) {
                value = false;
            }

            document.execCommand(action, false, value);

            // Force an update states right away
            this.updateStates();

            this.handleSelectionchange();
            this._markDirty();

            // Reset the focus
            if (editorElement != savedActiveElement) {
                savedActiveElement.focus();
            }
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
                prevValue;
                updateValues = function() {
                    clearTimeout(thisRef._forceUpdateValuesTimeout);
                    delete thisRef._forceUpdateValuesTimeout;
                    clearTimeout(thisRef._updateValuesTimeout);
                    delete thisRef._updateValuesTimeout;

                    if (defaultEventManager.registeredEventListenersForEventType_onTarget_("change@value", this)) {
                        prevValue = thisRef._value;
                        if (thisRef.value !== prevValue) {
                            thisRef.dispatchEvent(MutableEvent.changeEventForKeyAndValue("value" , prevValue).withPlusValue(thisRef.value));
                        }
                    }
                    if (defaultEventManager.registeredEventListenersForEventType_onTarget_("change@textValue", this)) {
                        prevValue = thisRef._textValue;
                        if (thisRef.textValue !== prevValue) {
                            thisRef.dispatchEvent(MutableEvent.changeEventForKeyAndValue("textValue" , prevValue).withPlusValue(thisRef.textValue));
                        }
                    }
                    thisRef._dispatchEditorEvent("editorChange");
                };

            if (!this._needsResetContent) {
                // Clear the cached value
                this._dirtyValue = true;
                this._dirtyTextValue = true;
            }

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

    /**
    Description TODO
    @private
    @function
    */
    _equalRange: {
        enumerable: false,
        value: function(rangeA, rangeB) {
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
