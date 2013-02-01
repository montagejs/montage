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
    @module "montage/ui/rich-text-editor/rich-text-editor.reel"
    @requires montage/core/core
    @requires montage/core/event/mutable-event
    @requires montage/core/event/event-manager
    @requires rich-text-sanitizer
*/
var Montage = require("montage").Montage,
    RichTextEditorBase = require("./rich-text-editor-base").RichTextEditorBase,
    Sanitizer = require("./rich-text-sanitizer").Sanitizer,
    ChangeNotification = require("core/change-notification").ChangeNotification,
    Promise = require("core/promise").Promise;

/**
    @classdesc The RichTextEditor component is a lightweight Montage component that provides basic HTML editing capability. It wraps the HTML5 <code>contentEditable</code> property and largely relies on the browser's support of <code><a href="http://www.quirksmode.org/dom/execCommand.html" target="_blank">execCommand</a></code>.
    @class module:"montage/ui/rich-text-editor/rich-text-editor.reel".RichTextEditor
    @extends module:montage/ui/component.Component
    @summary
The easiest way to create a RichTextEditor is with a serialization and a &lt;div> tag:<p>

<em>Serialization</em>
<pre class="sh_javascript">
{
"editor": {
   "prototype": "ui/rich-text-editor/rich-text-editor.reel",
   "properties": {
      "element": {"#": "editor" }
   }
}
</pre>
<em>HTML</em>
<pre class="sh_javascript">
&lt;body&gt;
&lt;div data-montage-id="editor"&gt;
    &lt;span&gt;Hello World!&lt;/span&gt;
&lt;/div&gt;
&lt;/body&gt;
</pre>
*/
exports.RichTextEditor = Montage.create(RichTextEditorBase,/** @lends module:"montage/ui/rich-text-editor/rich-text-editor.reel".RichTextEditor# */ {

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
      Gets or sets the editor's content as HTML. By default, the HTML content assigned to the editor's DOM element is used.
      The new value is passed through the editor's sanitizer before being assigned.
     @type {string}
    */
    value: {
        get: function() {
            var contentNode = this._innerElement,
                content = "",
                overlayElement = null,
                overlayParent,
                overlayNextSibling;

            if (this._dirtyValue && !this._value_locked) {
                this._value_locked = true;

                if (contentNode) {
                    // Temporary orphan the overlay slot while retrieving the content
                    overlayElement = contentNode.querySelector(".montage-Editor-overlay");
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

                if (this._value != content) {
                    this.dispatchPropertyChange("value", function(){
                        this._value = content;
                    });
                }

                this._dirtyValue = false;
                this._value_locked = false;
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
    Gets or sets the editor's content as plain text. By default, the text content assigned to the editor's DOM element is used.
    @type {string}
*/
    textValue: {
        enumerable: true,
        get: function() {
            var contentNode = this._innerElement,
                content = "",
                overlayElement = null,
                overlayParent,
                overlayNextSibling;

            if (this._dirtyTextValue && !this._textValue_locked) {
                this._textValue_locked = true;

                if (contentNode) {
                    // Temporary orphan the overlay slot in order to retrieve the content
                    overlayElement = contentNode.querySelector(".montage-Editor-overlay");
                    if (overlayElement) {
                        overlayParent = overlayElement.parentNode;
                        overlayNextSibling = overlayElement.nextSibling;
                        overlayParent.removeChild(overlayElement);
                    }

                    content = this._innerText(contentNode);

                     // restore the overlay
                    if (overlayElement) {
                        overlayParent.insertBefore(overlayElement, overlayNextSibling);
                    }
                }

                if (this._textValue != content) {
                    this.dispatchPropertyChange("textValue", function(){
                        this._textValue = content;
                    });
                }

                this._dirtyTextValue = false;
                this._textValue_locked = false;
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
      Gets or sets the editor's delegate object that can define one or more delegate methods that a consumer can implement. For a list of delegate methods, see [Delegate methods]{@link  http://tetsubo.org/docs/montage/using-the-rich…itor-component#Delegate_methods}.
     @type {object}
    */
    delegate: {
        enumerable: true,
        value: null
    },

    /**
    The role of the sanitizer is to cleanup any data before its inserted, or extracted, from the editor. The default sanitizer removes any JavaScript, and scopes any CSS before injecting any data into the editor. However, JavaScript is not removed when the initial value is set using <code>editor.value</code>.
     @type {object}
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
      An array of overlay objects available to the editor. Overlays are UI components that are displayed on top of the editor based on the context.
     @type {array}
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
      Returns the overlay currently being displayed.
     @type {object}
    */
    activeOverlay: {
        get: function() {
            return this._activeOverlay;
        }
    },

    /**
      Displays the specified overlay.
     @function
     @param {object} overlay The overlay to display.
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
     Hides the active overlay.
     @function
    */
    hideOverlay: {
        value: function(a) {
            var slot = this._overlaySlot,
                slotElem = slot ? slot.element : null;

            if (slotElem) {
                if (slotElem.parentNode) {
                    slotElem.parentNode.removeChild(slotElem);
                }
                this._activeOverlay = null;
                slot.content = null;
            }
        }
    },


    // Edit Actions & Properties

    /**
      Returns <code>true</code> if the current text selection is bold. If the selected text contains some text in bold and some not, the return value depends on the browser’s implementation. When set to <code>true</code>, adds the bold attribute to the selected text; when set to <code>false</code>, removes the bold attribute from the selected text.
     @type {boolean}
    */
    bold: {
        enumerable: true,
        get: function() { return this._genericCommandGetter("bold", "bold"); },
        set: function(value) { this._genericCommandSetter("bold", "bold", value); }
    },

    /**
      Returns <code>true</code> if the current text selection is underlined. If the selected text contains some text in underline and some not, the return value depends on the browser’s implementation. When set to <code>true</code>, adds the underline attribute to the selected text; when set to <code>false</code>, removes the underline attribute from the selected text.
    @type boolean
    */
    underline: {
        enumerable: true,
        get: function() { return this._genericCommandGetter("underline", "underline"); },
        set: function(value) { this._genericCommandSetter("underline", "underline", value); }
    },

    /**
    Returns <code>true</code> if the current text selection is italicized. If the selected text contains some text in italics and some not, the return value depends on the browser’s implementation. When set to <code>true</code>, adds the italic attribute to the selected text; when set to <code>false</code>, removes the italic attribute from the selected text.
    @type boolean
    */
    italic: {
        enumerable: true,
        get: function() { return this._genericCommandGetter("italic", "italic"); },
        set: function(value) { this._genericCommandSetter("italic", "italic", value); }
    },

    /**
    Returns <code>true</code> if the current text selection has the strikethrough style applied. If the selected text contains some text with strikethrough and some not, the return value depends on the browser’s implementation. When set to <code>true</code>, adds the italic attribute to the selected text; when set to <code>false</code>, removes the italic attribute from the selected text.
    @type boolean
    */

    strikeThrough: {
        enumerable: false,
        get: function() { return this._genericCommandGetter("strikeThrough", "strikethrough"); },
        set: function(value) { this._genericCommandSetter("strikeThrough", "strikethrough", value); }
    },

    /**
    Gets and sets the baseline shift for the currently selected text. Valid values are "baseline", "subscript", or "superscript".
     @type {string}
     @default "baseline"
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
    Indent the selected text. If the selected text is inside a list, calling this method moves the selection into a sub-list.
    @function
    */
    indent: {
        enumerable: true,
        value: function() { this.doAction("indent"); }
    },

    /**
    Indent the selected text. If the selected text is inside a list, calling this method moves the selection either out of the list, or into the parent list.
    @function
    */
    outdent: {
        enumerable: true,
        value: function() { this.doAction("outdent"); }
    },

    /**
      Gets and sets the list style for the selected text. Valid values are "none", "unordered", "ordered". This property can be used in combination with the [indent]{@link indent} and [outdent]{@link outdent} methods to create a list hierarchy.
     @type {string}
    */
    listStyle: {
        enumerable: true,
        get: function() {
            this._listStyle = this._listStyleGetState();
            return this._listStyle;
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
        Gets and sets the justification on the selected text. Valid values are "left", "center", "right", and "full". If the current selection is across multiple lines with different justifications, the value of this property depends of the browser’s implementation.
        @type {string}
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
      Gets and sets the font name for the currently selected text as a CSS font-family. Can be set to any valid CSS font-family value, including multiple values. If the current selection is across multiple font-family elements, the specific return value depends of the browser’s implementation.
     @type {string}
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
      Gets and sets the font size for the current text selection. Only HTML font size values 1 through 7 are supported. If the current selection is a mix of font size, the return value depends of the browser’s implementation.
     @type {string}
    */
    fontSize: {
        enumerable: true,
        get: function() { return this._genericCommandGetter("fontSize", "fontsize"); },
        set: function(value) { this._genericCommandSetter("fontSize", "fontsize", value); }
    },

    /**
      Gets and sets the background color of the currently selected text. This property can be set to any valid CSS color value; however, the color is always returned as an RGB color. If the current selection spans across elements with different background colors, the return value depends on the browser’s implementation.
     @type {string}
    */
    backColor: {
        enumerable: true,
        get: function() { return this._genericCommandGetter("backColor", "backcolor"); },
        set: function(value) { this._genericCommandSetter("backColor", "backcolor", value === null ? "inherit" : value); }
    },

    /**
      Gets and sets the background color of the currently selected text. This property can be set to any valid CSS color value; however, the color is always returned as an RGB color. If the current selection spans across elements with different background colors, the return value depends on the browser’s implementation. To remove a background color, set it to <code>null</code>.
     @type {string}
    */
    foreColor: {
        enumerable: true,
        get: function() { return this._genericCommandGetter("foreColor", "forecolor"); },
        set: function(value) {  this._genericCommandSetter("foreColor", "forecolor", value === null ? "inherit" : value); }
    },

    /**
      Selects the all the content contained by the editor. Depending on the browser's implementation, some of the outer elements without direct text nodes won't be selected. Consequently, if the user presses the delete key after all the text is selected with this method, selecting all, some markup might still be there, you will have to Select all again to get rid of it.
      @function
    */
    selectAll: {
        enumerable: true,
        value: function() { this.doAction("selectall"); }
    },

    /**
      Selects the specified DOM element.
     @function
     @param {element} element The element to select.
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
    Gets and sets the Montage undo manager for the editor. By default, it's assigned an instance of the default Montage UndoManager. The component also works with the native Undo Manager provided by the browser. To use the native undo manager, set this property to <code>null</code>
    @type {object}
    */
    undoManager: {
        enumerable: true,
        get: function() { return this._undoManager },
        set: function(value) { this._undoManager = value }
    },

    /**
    Undo the last editing operation.
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
    Redo the last editing operation that was canceled by calling <code>undo()</code>.
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
    Equivalent to the native <code><a href="https://developer.mozilla.org/en/Rich-Text_Editing_in_Mozilla#Executing%5FCommands" target="_blank">document.execCommand</a></code> method, it also sets the focus on the editor before executing the command, marks the editor’s content as dirty, and add the command to the Montage Undo Manager stack using the label provided.

    You should only use this method if you are extending the editor’s functionality, or writing your own overlay. The typical usage would be to insert HTML via the <code>insertHTML</code> command. All other <code>execCommand</code> commands are exposed as bindable properties on the editor, like <code>bold</code> or <code>italic</code>, and those puse the editor property instead.
    @function
    @param {string} command The command to execute.
    @param {boolean} showUI Specifies whether the default user interface should be drawn.
    @param {string|number} value The value to pass as an argument to the command. Possible values depend on the command.
    @param {string} label The label to use when adding this command to the undo stack managed by the Montage UndoManager.
    */
    execCommand: {
        enumerable: false,
        value: function(command, showUI, value, label) {
            var savedActiveElement = document.activeElement,
                editorElement = this._innerElement,
                retValue = false;

            if (!editorElement) {
                return false;
            }

            // Make sure we are the active element before calling execCommand
            if (editorElement != savedActiveElement) {
                editorElement.focus();
            }

            if (value === undefined) {
                value = false;
            }

            label = label || this._execCommandLabel[command] || "Typing";

            this._executingCommand = true;
            if (document.execCommand(command, showUI, value)) {
                this._executingCommand = false;
                if (["selectall"].indexOf(command) == -1) {
                    if (this.undoManager ) {
                        this._stopTyping();
                        this.undoManager.register(label, Promise.resolve([this._undo, this, label, this._innerElement]));
                    }
                } else {
                    this.markDirty();
                }

                this.handleSelectionchange();
                retValue = true;
            } else {
                this._executingCommand = false;
            }

            // Reset the focus
            if (editorElement != savedActiveElement) {
                savedActiveElement.focus();
            }

            return retValue;
        }
    },

    /**
    Marks the editor content as dirty, causing the editor to generate an <code>editorChange</code> event, and update the editor's <code>value</code> and <code>textValue</code> properties. This method should only be called if you are extending the editor or writing an overlay.
    @private
    @function
    */
    markDirty: {
        enumerable: false,
        value: function() {
            var thisRef = this;

            var updateValues = function() {
                var value,
                    descriptor;

                clearTimeout(thisRef._forceUpdateValuesTimeout);
                delete thisRef._forceUpdateValuesTimeout;
                clearTimeout(thisRef._updateValuesTimeout);
                delete thisRef._updateValuesTimeout;

                if (thisRef._dirtyValue) {
                    descriptor = ChangeNotification.getPropertyChangeDescriptor(thisRef, "value");
                    if (descriptor) {
                        value = thisRef.value;  // Will force to update the value and send a property change notification
                    }
                }
                if (thisRef._dirtyTextValue) {
                    descriptor = ChangeNotification.getPropertyChangeDescriptor(thisRef, "textValue");
                    if (descriptor) {
                        value = thisRef.textValue;  // Will force to update the value and send a property change notification
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
