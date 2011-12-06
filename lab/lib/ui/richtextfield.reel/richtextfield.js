/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/richtextfield.reel"
    @requires montage/core/core
    @requires montage/ui/editable-text
*/
var Montage = require("montage").Montage,
    MutableEvent = require("core/event/mutable-event").MutableEvent,
    Component = require("ui/component").Component;

/**
    @class module:"montage/ui/richtextfield.reel".RichTextfield
    @extends module:montage/ui/component.Component
*/
exports.RichTextfield = Montage.create(Component,/** @lends module:"montage/ui/richtextfield.reel".RichTextfield# */ {

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
    _hasChanged: {
        enumerable: false,
        value: false
    },

    /**
      Description TODO
     @type {Function}
    */
    hasChanged: {
        enumerable: true,
        get: function() {
            return this._hasChanged;
        }
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
            if (this._hasChanged) {
                this._value = this.element.innerHTML;
                this._hasChanged = false;
            }
            return this._value;
        },
        set: function(value) {
            if (this._value !== value) {
                this._value = value;
                this._needSelectionReset = true;
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
            if (this._hasChanged) {
                this._textValue = this.element.innerText;
                this.__lookupGetter__("value").call(this); // Force the hasChanged state to sync up
            }
            return this._textValue;
        }
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
            if (this._states == null || this._statesDirty) {
                this.updateStates();
            }

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
                statesChanged = false;

            states = this._states || {};
            for (key in actions) {
                action = actions[key];
                state = "false";
                if (action.enabled && action.status) {
                    state = (document.queryCommandState(key) ? "true" : "false");
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
            bold: {enabled: true, status: true},
            italic: {enabled: true, status: true},
            underline: {enabled: true, status: true},
            strikethrough: {enabled: true, status: true},
            indent: {enabled: true, status: false},
            outdent: {enabled: true, status: false},
            insertorderedlist: {enabled: true, status: true},
            insertunorderedlist: {enabled: true, status: true}
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    actions: {
        enumerable: false,
        get: function() {
            return this._actions;
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    enabledActions: {
        enumerable: true,
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


    // Callbacks
    /**
    Description TODO
    @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {
            var el = this.element;
            el.classList.add('montage-richtextfield');
            el.setAttribute("contentEditable", "true");

            el.addEventListener("focus", this);

            el.addEventListener("dragstart", this, false);
            el.addEventListener("dragend", this, false);
            el.addEventListener("dragover", this, false);
            el.addEventListener("drop", this, false);
        }
    },

    /**
    Description TODO
    @function
    */
    draw: {
        enumerable: false,
        value: function() {
            this.element.innerHTML = this._value;
        }
    },

    // Event handlers
    /**
    Description TODO
    @function
    */
    handleFocus: {
        enumerable: false,
        value: function() {
            var el = this.element;

            this._hasFocus = true;
            if (this._needSelectionReset) {
                // JFD TODO: reset the user selection, set the caret at the end of the last text element
                this._needSelectionReset = false;
            }

            el.addEventListener("blur", this);
            el.addEventListener("input", this);
            el.addEventListener("keypress", this);
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

            this._hasFocus = false;

            if (this._selectionChangeTimer) {
                clearTimeout(this._selectionChangeTimer);
                this._selectionChangeTimer = null;
            }


            el.removeEventListener("blur", this);
            el.removeEventListener("input", this);
            el.removeEventListener("keypress", this);
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
            this._hasChanged = true;
            if (this._hasSelectionChangeEvent === false) {
                this.handleSelectionchange();
            }
            this._dispatchEditorEvent("editorChange");
        }
    },

    /**
    Description TODO
    @function
    */
    handleInput: {
        enumerable: false,
        value: function(event) {
            this._hasChanged = true;
            if (this._hasSelectionChangeEvent === false) {
                this.handleSelectionchange();
            }
            this.handleDragend(event);
            this._dispatchEditorEvent("editorChange");
        }
    },

    /**
    Description TODO
    @function
    */
    handleKeyup: {
        enumerable: false,
        value: function() {
            if (this._hasSelectionChangeEvent === false) {
                this.handleSelectionchange();
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
            if (this._hasSelectionChangeEvent === false) {
                this.handleSelectionchange();
            }
            this.handleDragend(event);
        }
    },

    /**
    Description TODO
    @function
    */
    handleTouchend: {
        enumerable: false,
        value: function() {
            if (this._hasSelectionChangeEvent === false) {
                this.handleSelectionchange();
            }
            if (this._dragSourceElement) {
                this.handleDragend();
            }
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

            if (this._selectionChangeTimer) {
                clearTimeout(this._selectionChangeTimer);
            }

            this._statesDirty = true;    // clear the cached states to force query it again
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
            if (event.cancelBubble) {
                event.cancelBubble = true;
            } else {
                event.stopPropagation();
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
                    if (window.getSelection) {
                        var selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } else {
                        range.select();
                    }
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
            if (event.cancelBubble) {
                event.cancelBubble = true;
            } else {
                event.stopPropagation();
            }

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
                                }
                            }
                        }
                        reader.onprogress = function(e) {
                        }
                        reader.onerror = function(e) {
                        }
                        reader.readAsDataURL(file);
                    } else {
                        // JFD: This browser does not support the File API, we cannot do a preview...
                        if (delegateMethod) {
                            response = delegateMethod.call(this.delegate, this, file);
                        }
                        if (response === true) {
                            // JFD TODO: write me!
                        }
                    }
                }
            } else {
                data = event.dataTransfer.getData("text/html");
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
                    }
                    if (data && data.length) {
                        document.execCommand("inserthtml", false, data);
                    }
                } else {
                    data = event.dataTransfer.getData("text/plain") || event.dataTransfer.getData("text");
                    if (data) {
                        var div = document.createElement('div');
                        div.innerText = data;
                        document.execCommand("inserthtml", false, div.innerHTML);
                    }
                }
            }
            this.handleDragend(event);
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
            var action = event.currentTarget.action || event.currentTarget.identifier;
            if (action) {
                this.doAction(action);
            }
        }
    },

    /**
    Description TODO
    @function
    */
    doAction: {
        enumerable: true,
        value: function(action) {

            // Check if the action is valid and enabled
            if (this._actions[action] && this._actions[action].enabled === true) {
                document.execCommand("styleWithCSS", false, true);
                document.execCommand(action, false, false);
                document.execCommand("styleWithCSS", false, false);

                this.handleSelectionchange();
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
        enumerable: true,
        value: function(type, value) {
            var editorEvent = document.createEvent("CustomEvent");
            editorEvent.initCustomEvent(type, true, false, value === undefined ? null : value);
            editorEvent.type = type;
            this.dispatchEvent(editorEvent);
        }
    },

    _delegateMethod: {
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
    }
});
