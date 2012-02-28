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
    RichTextEditorBase = require("./rich-text-editor-base").RichTextEditorBase,
    MutableEvent = require("core/event/mutable-event").MutableEvent,
    defaultEventManager = require("core/event/event-manager").defaultEventManager;

/**
    @class module:"montage/ui/rich-text-editor.reel".RichTextEditor
    @extends module:montage/ui/component.Component
*/
exports.RichTextEditor = Montage.create(RichTextEditorBase,/** @lends module:"montage/ui/rich-text-editor.reel".RichTextEditor# */ {

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
      @type {Function}
    */
    focus: {
        enumerable: true,
        value: function() {
            this._needsFocus = true;
            this.needsDraw = true;
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    isActiveElement: {
        enumerable: true,
        get: function() {
            return this._isActiveElement;
        }
    },

    /**
      Description TODO
     @type {Function}
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
                    // Reset the resizer and Active link popup
                    if (this._resizer) {
                        this._needsHideResizer = true;
                    }
                    this._needsActiveLinkOn = null;
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
            var contentNode = this.element.firstChild,
                content;

            if (this._dirtyValue) {
                if (contentNode) {
                    if (this._resizer) {
                        contentNode = this._resizer.cleanup(contentNode);
                    }
                    if (this._activeLinkBox) {
                        contentNode = this._activeLinkBox.cleanup(contentNode);
                    }
                }

                content = contentNode ? contentNode.innerHTML : "";
                if (content == "<br>") {
                    // when the contentEditable div is emptied, Chrome add a <br>, let's filter it out
                    content = "";
                }
                if (this._sanitizer) {
                    content = this._sanitizer.didGetValue(content, this._uniqueId);
                }

                this._value = content;
                this._dirtyValue = false;
            }
            return this._value;
        },
        set: function(value) {
            if (this._value !== value || this._dirtyValue) {
                if (this._resizer) {
                    this._needsHideResizer = true;
                }
                if (this._sanitizer) {
                    value = this._sanitizer.willSetValue(value, this._uniqueId);
                }
                this._value = value;
                this._dirtyValue = false;
                this._dirtyTextValue = true;
                this._needsSelectionReset = true;
                this._needsResetContent = true;
                this.needsDraw = true;
            }
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    textValue: {
        enumerable: true,
        get: function() {
            var contentNode = this.element.firstChild;

            if (this._dirtyTextValue) {
                if (contentNode) {
                    if (this._resizer) {
                        contentNode = this._resizer.cleanup(contentNode);
                    }
                    if (this._activeLinkBox) {
                        contentNode = this._activeLinkBox.cleanup(contentNode);
                    }
                }

                this._textValue = contentNode ? this._innerText(contentNode) : "";
                this._dirtyTextValue = false;
            }
            return this._textValue;
        },
        set: function (value) {
            if (this._textValue !== value || this._dirtyTextValue) {
                if (this._resizer) {
                    this._needsHideResizer = true;
                }

                this._textValue = value;
                this._dirtyTextValue = false;
                this._dirtyValue = true;
                this._needsSelectionReset = true;
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
    activeLinkBox: {
        enumerable: false,
        get: function() {
            return  this._activeLinkBox;
        },
        set: function(value) {
             // force hide the current activeLinkBox
            if (this._activeLinkBox) {
                this._activeLinkBox.hide();
            }
            this._activeLinkBox = value;
            if (this._activeLinkBox) {
                this._activeLinkBox.initialize(this);
            }
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    resizer: {
        enumerable: false,
        get: function() {
            return  this._resizer;
        },
        set: function(value) {
            // force hide the current resizer
            if (this._resizer){
                this._resizer.hide();
                delete this._needsHideResizer;
            }
            this._resizer = value;
            if (this._resizer) {
                this._resizer.initialize(this);
            }
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    allowDrop: {
        enumerable: true,
        serializable: true,
        get: function() {
            return this._allowDrop;
        },
        set: function(value) {
            this._allowDrop = value;
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
        set: function(value) { this._genericCommandSetter("backColor", "backcolor", value); }
    },

    /**
      Description TODO
     @type {Function}
    */
    foreColor: {
        enumerable: true,
        get: function() { return this._genericCommandGetter("foreColor", "forecolor"); },
        set: function(value) { this._genericCommandSetter("foreColor", "forecolor", value); }
    }
});
