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
    _commands: {
        enumerable: false,
        value: {"bold": true, "italic": true, "underline": true, "strikethrough": true, "indent": true, "outdent": true,
            "insertorderedlist": true, "insertunorderedlist": true}
    },

    /**
      Description TODO
     @type {Function}
    */
    actions: {
        enumerable: false,
        get: function() {
            return this._commands;
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    enabledActions: {
        enumerable: true,
        set: function(enabledActions) {
            var actions = this._commands,
                nbrEnabledActions = enabledActions.length,
                action,
                i;

            for (action in this._commands) {
                this._commands[action] = false;
            }

            for (i = 0; i < nbrEnabledActions; i ++) {
                action = enabledActions[i];
                if (actions[action] !== undefined) {
                    actions[action] = true;
                }
            }

            console.log("COMMANDS:", this._commands);
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
    handleEvent: {
        value: function(event) {

            var handlerName = "handle" + event.type.toCapitalized();

            if (typeof this[handlerName] === "function") {
                this[handlerName](event);
            } else {
                if (this._hasSelectionChangeEvent === false) {
                    var type = event.type;
                    if (type == "keyup" || type == "mouseup" || type == "touchend") {
                        this.handleSelectionchange();
                    }
                }
            }
        }
    },
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
                el.addEventListener(window.Touch ? "touchend" : "mouseup", this);
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

            el.removeEventListener("blur", this);
            el.removeEventListener("input", this);
            el.removeEventListener("keypress", this);
            
            document.removeEventListener("selectionchange", this);

            if (this._hasSelectionChangeEvent === false) {
                el.addEventListener(window.Touch ? "touchend" : "mouseup", this);
                el.addEventListener("keydup", this);
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
            // JFD TODO: We might want to use a timer to avoid doing too much processing when the user type...
            this.callDelegateMethod("didValueChanged", this);
        }
    },

    /**
    Description TODO
    @function
    */
    handleInput: {
        enumerable: false,
        value: function() {
            this._hasChanged = true;
            if (this._hasSelectionChangeEvent === false) {
                this.handleSelectionchange();
            }
            this.callDelegateMethod("didValueChanged", this);
        }
    },

    /**
    Description TODO
    @function
    */
    handleSelectionchange: {
        enumerable: false,
        value: function() {
            if (this._hasSelectionChangeEvent == null) {
                this._hasSelectionChangeEvent = true;
            }

            this.callDelegateMethod("didSelectionChanged", this);
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
            var action = event.currentTarget.identifier;
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
            if (this._commands[action] === true) {
                document.execCommand("styleWithCSS", false, true);
                document.execCommand(action, false, false);
                document.execCommand("styleWithCSS", false, false);

                if (this._hasSelectionChangeEvent === false) {
                    this.handleSelectionchange();
                }
            }
        }
    }

});

