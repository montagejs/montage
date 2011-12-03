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
            var actions = this._actions,
                key,
                action,
                states,
                state,
                statesChanged = false;

            if (this._states == null || this._statesDirty) {
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
                this._states = states;

                if (statesChanged) {
                    // As we do not have a setter, we need to manually dispatch a change event
                    this.dispatchEvent(MutableEvent.changeEventForKeyAndValue("states" , this._states));
                }
            }


            return this._states;

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

            if (this._selectionChangeTimer) {
                clearTimeout(this._selectionChangeTimer);
                this._selectionChangeTimer = null;
            }


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
//            this.callDelegateMethod("didValueChanged", this);
            this._dispatchEditorEvent("editorChange");
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
//            this.callDelegateMethod("didValueChanged", this);
            this._dispatchEditorEvent("editorChange");
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

            if (this._selectionChangeTimer) {
                clearTimeout(this._selectionChangeTimer);
            }

            this._statesDirty = true;    // clear the cached states to force qyery it again
            this._selectionChangeTimer = setTimeout(function() {
                thisRef._dispatchEditorEvent("editorSelect");
            }, 50);
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
    }
});

