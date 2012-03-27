/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/rich-text-editor.reel"
    @requires montage/core/core
    @requires "montage/ui/rich-text-editor.reel"
*/
var Montage = require("montage").Montage,
    RichTextEditorBase = require("./rich-text-editor-base").RichTextEditorBase,
    Sanitizer = require("./rich-text-sanitizer").Sanitizer,
    MutableEvent = require("core/event/mutable-event").MutableEvent,
    defaultEventManager = require("core/event/event-manager").defaultEventManager;

/**
    The RichTextEditor component is a lightweight Montage component that provides basic HTML editing capability. It wraps the HTML5 <code>contentEditable</code> property and largely relies on the browser's support of <code><a href="http://www.quirksmode.org/dom/execCommand.html" target="_blank">execCommand</a></code>.
    @class module:"montage/ui/rich-text-editor.reel".RichTextEditor
    @extends module:montage/ui/component.Component
*/
exports.RichTextEditor = Montage.create(RichTextEditorBase,/** @lends module:"montage/ui/rich-text-editor.reel".RichTextEditor# */ {

/**
    Returns <code>true</code> if the edtior has focus, otherwise returns <code>false</code>.
    @type {boolean}
    @readonly
*/
    hasFocus: {
        enumerable: true,
        get: function() {
            return this._hasFocus;
        }
    },

/**
    Returns the editor's inner element, which is the element that is editable.
     @type {Element}
    @readonly
*/
    innerElement: {
        enumerable: true,
        get: function() {
            return this._innerElement;
        }
    },


    /**
      Sets the focus on the editor's element. The editor will also become the <code>activeElement</code>.
      @function
    */
    focus: {
        enumerable: true,
        value: function() {
            this._needsFocus = true;
            this.needsDraw = true;
        }
    },

    /**
      Returns <code>true</code> when the editor is the active element, otherwise return <code>false</code>. Normally the active element has also focus. However, in a multiple window environment it’s possible to be the active element without having focus. Typically, a toolbar item my steal the focus but not become the active element.

     @type {boolean}
    @readonly
    @type {string|Array<string>}
    */
    isActiveElement: {
        enumerable: true,
        get: function() {
            return this._isActiveElement;
        }
    },

    /**
     Returns <code>true</code> if the content is read only, otherwise returns <code>false</code>. When the editor is set to read only, the user is not able to modify the content. However it still possible to set the content programmatically with by setting the <code>value</code> or <code>textValue</code> properties.
     @type {boolean}
    */
    readOnly: {
        enumerable: true,
        get: function() {
            return this._readOnly;
        },
        set: function(value) {
            if (this._readOnly !== value) {
                this._readOnly = value;
                if (value) {
                    // Remove any overlay
                    this.hideOverlay();
                }
                this.needsDraw = true;
            }
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    value: {
        enumerable: true,
        serializable: true,
        get: function() {
            var contentNode = this._innerElement,
                content = "",
                overlayElement = null,
                overlayParent,
                overlayNextSibling;

            if (this._dirtyValue) {
                if (contentNode) {
                    // Temporary orphran the overlay slot while retrieving the content
                    overlayElement = contentNode.querySelector(".montage-editor-overlay");
                    if (overlayElement) {
                        overlayParent = overlayElement.parentNode;
                        overlayNextSibling = overlayElement.nextSibling;
                        overlayParent.removeChild(overlayElement);
                    }
                    content = contentNode.innerHTML;
                }

                if (content == "<br>") {
                    // when the contentEditable div is emptied, Chrome add a <br>, let's filter it out
                    content = "";
                }
                if (this._sanitizer === undefined) {
                    this._sanitizer = Sanitizer.create();
                }
                if (this._sanitizer) {
                    content = this._sanitizer.didGetValue(content, this._uniqueId);
                }

                // restore the overlay
                if (overlayElement) {
                    overlayParent.insertBefore(overlayElement, overlayNextSibling);
                }

                this._value = content;
                this._dirtyValue = false;
            }
            return this._value;
        },
        set: function(value) {
            if (this._value !== value || this._dirtyValue) {
                // Remove any overlay
                this.hideOverlay();

                if (this._sanitizer === undefined) {
                    this._sanitizer = Sanitizer.create();
                }
                if (this._sanitizer) {
                    value = this._sanitizer.willSetValue(value, this._uniqueId);
                }
                this._value = value;
                this._dirtyValue = false;
                this._dirtyTextValue = true;
                this._needsAssingValue = true;
                this.needsDraw = true;
            }
            this._needsOriginalContent = false;
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    textValue: {
        enumerable: true,
        get: function() {
            var contentNode = this._innerElement,
                overlayElement = null,
                overlayParent,
                overlayNextSibling;

            if (this._dirtyTextValue) {
                if (contentNode) {
                    // Temporary orphran the overlay slot in order to retrieve the content
                    overlayElement = contentNode.querySelector(".montage-editor-overlay");
                    if (overlayElement) {
                        overlayParent = overlayElement.parentNode;
                        overlayNextSibling = overlayElement.nextSibling;
                        overlayParent.removeChild(overlayElement);
                    }

                    this._textValue = this._innerText(contentNode);

                     // restore the overlay
                    if (overlayElement) {
                        overlayParent.insertBefore(overlayElement, overlayNextSibling);
                    }
                } else {
                    this._textValue = "";
                }

                this._dirtyTextValue = false;
            }
            return this._textValue;
        },
        set: function (value) {
            if (this._textValue !== value || this._dirtyTextValue) {
                // Remove any overlay
                this.hideOverlay();

                this._textValue = value;
                this._dirtyTextValue = false;
                this._dirtyValue = true;
                this._needsAssingValue = true;
                this.needsDraw = true;
            }
            this._needsOriginalContent = false;
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
     @type {Function}
    */
    overlays: {
        enumerable: false,
        get: function() {
            return  this._overlays;
        },
        set: function(value) {
            this.hideOverlay();
            if (value instanceof Array) {
                this._overlays = value;
                this._callOverlays("initWithEditor", this, true);
            } else {
                this._overlays = null;
            }
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    activeOverlay: {
        get: function() {
            return this._activeOverlay;
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    showOverlay: {
        value: function(overlay) {
            var slot = this._overlaySlot,
                slotElem = slot ? slot.element : null;

            if (slotElem) {
                this._activeOverlay = overlay;
                this._innerElement.appendChild(slotElem.parentNode ? slotElem.parentNode.removeChild(slotElem) : slotElem);
                slot.attachToParentComponent();
                slot.content = overlay;
            }
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    hideOverlay: {
        value: function(a) {
            var slot = this._overlaySlot,
                slotElem = slot ? slot.element : null;

            if (slotElem) {
                if (slotElem.parentNode) {
                    slotElem.parentNode.removeChild(slotElem)
                }
                this._activeOverlay = null;
                slot.content = null;
            }
        }
    },


    // Edit Actions & Properties

    /**
      Description TODO
     @type {Function}
    */
    bold: {
        enumerable: true,
        get: function() { return this._genericCommandGetter("bold", "bold"); },
        set: function(value) { this._genericCommandSetter("bold", "bold", value); }
    },

    /**
      Description TODO
     @type {Function}
    */
    underline: {
        enumerable: true,
        get: function() { return this._genericCommandGetter("underline", "underline"); },
        set: function(value) { this._genericCommandSetter("underline", "underline", value); }
    },

    /**
      Description TODO
     @type {Function}
    */
    italic: {
        enumerable: true,
        get: function() { return this._genericCommandGetter("italic", "italic"); },
        set: function(value) { this._genericCommandSetter("italic", "italic", value); }
    },

    /**
      Description TODO
     @type {Function}
    */
    strikeThrough: {
        enumerable: false,
        get: function() { return this._genericCommandGetter("strikeThrough", "strikethrough"); },
        set: function(value) { this._genericCommandSetter("strikeThrough", "strikethrough", value); }
    },

    /**
      Description TODO
     @type {Function}
    */
    baselineShift: {
        enumerable: true,
        get: function() {
            this._baselineShift = this._baselineShiftGetState();
            return this._baselineShift;
        },
        set: function(value) {
            var state = this._baselineShiftGetState();

            if (state != value) {
                if (value == "baseline") {
                    if (state == "subscript") {
                        this.doAction("subscript");
                    } else if (state == "superscript") {
                        this.doAction("superscript");
                    }
                } else if (value == "subscript") {
                    this.doAction("subscript");
                } else if (value == "superscript") {
                    this.doAction("superscript");
                }
            }
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    indent: {
        enumerable: true,
        value: function() { this.doAction("indent"); }
    },

    /**
      Description TODO
     @type {Function}
    */
    outdent: {
        enumerable: true,
        value: function() { this.doAction("outdent"); }
    },

    /**
      Description TODO
     @type {Function}
    */
    listStyle: {
        enumerable: true,
        get: function() {
            this._liststyle = this._listStyleGetState();
            return this._liststyle;
        },
        set: function(value) {
            var state = this._listStyleGetState();

            if (state != value) {
                if (value == "none") {
                    this.doAction(state == "ordered" ? "insertorderedlist" : "insertunorderedlist");
                } else if (value == "ordered") {
                    this.doAction("insertorderedlist");
                } else if (value == "unordered") {
                    this.doAction("insertunorderedlist");
                }
            }
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    justify: {
        enumerable: true,
        get: function() {
            this._justify = this._justifyGetState();
            return this._justify;
        },
        set: function(value) {
            var state = this._justifyGetState();
            if (state != value && ["left", "center", "right", "full"].indexOf(value) !== -1) {
                this.doAction("justify" + value);
            }
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    fontName: {
        enumerable: true,
        get: function() {
            this._fontName = this._fontNameGetState();
            return this._fontName;
        },
        set: function(value) { this._genericCommandSetter("fontName", "fontname", value); }
    },

    /**
      Description TODO
     @type {Function}
    */
    fontSize: {
        enumerable: true,
        get: function() { return this._genericCommandGetter("fontSize", "fontsize"); },
        set: function(value) { this._genericCommandSetter("fontSize", "fontsize", value); }
    },

    /**
      Description TODO
     @type {Function}
    */
    backColor: {
        enumerable: true,
        get: function() { return this._genericCommandGetter("backColor", "backcolor"); },
        set: function(value) { this._genericCommandSetter("backColor", "backcolor", value === null ? "inherit" : value); }
    },

    /**
      Description TODO
     @type {Function}
    */
    foreColor: {
        enumerable: true,
        get: function() { return this._genericCommandGetter("foreColor", "forecolor"); },
        set: function(value) {  this._genericCommandSetter("foreColor", "forecolor", value === null ? "inherit" : value); }
    },

    /**
      Description TODO
     @type {Function}
    */
    selectAll: {
        enumerable: true,
        value: function() { this.doAction("selectall"); }
    },

    /**
      Description TODO
     @type {Function}
    */
    selectElement: {
        enumerable: true,
        value: function(element) {
            var offset,
                range;

            offset = this._nodeOffset(element);
            if (offset !== -1) {
                range = document.createRange();
                range.setStart(element.parentNode, offset);
                range.setEnd(element.parentNode, offset + 1);
                this._selectedRange = range;
            }
        }
    },

    /**
    Description TODO
    @function
    */
    undoManager: {
        enumerable: true,
        get: function() { return this._undoManager },
        set: function(value) { this._undoManager = value }
    },

    /**
    Description TODO
    @function
    */
    undo: {
        enumerable: true,
        value: function() {
            if (this.undoManager) {
                this.undoManager.undo();
            } else {
                this._undo();
            }
        }
    },

    /**
    Description TODO
    @function
    */
    redo: {
        enumerable: true,
        value: function() {
            if (this.undoManager) {
                this.undoManager.redo();
            } else {
                this._redo();
            }
        }
    },

    /**
    Description TODO
    @function
    */
    execCommand: {
        enumerable: false,
        value: function(command, showUI, value, label) {
            label = label || this._execCommandLabel[command] || "Typing";

            this._executingCommand = true;
            if (document.execCommand(command, showUI, value)) {
                this._executingCommand = false;
                this._stopTyping();
                if (this.undoManager && ["selectall"].indexOf(command) == -1 ) {
                    this.undoManager.add(label, this._undo, this, label, this._innerElement);
                }
                return true;
            } else {
                this._executingCommand = true;
                return false
            }
        }
    },

    /**
    Description TODO
    @private
    @function
    */
    markDirty: {
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

            if (!this._needsAssingValue) {
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
            this._updateValuesTimeout = setTimeout(updateValues, 100);
        }
    }

});
