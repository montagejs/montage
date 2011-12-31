/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/rich-text-sanitizer.js"
    @requires montage/core/core
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component

/**
    @class module:"montage/ui/shortcut-manager.js".ShortcutManager
*/
exports.ShortcutManager = Montage.create(Montage,/** @lends module:"montage/ui/shortcut-manager.js".ShortcutManager# */ {

    /**
      Description TODO
      @private
    */
    _keydownListenerRegistered: {
        enumerable: false,
        value: false,
        distinct: true
    },

    /**
      Description TODO
      @private
    */
    _modifiersMap: {
        enumerable: false,
        value: null
    },

    /**
      Description TODO
      @private
    */
    _keyNames: {
        enumerable: false,
        value: {
            "BACKSPACE": 8,
            "TAB": 9,
            "ENTER": 13,
            "ESCAPE": 27,
            "PAGEUP": 33,
            "PAGEDOWN": 34,
            "END": 35,
            "HOME": 36,
            "LEFT": 37,
            "UP": 38,
            "RIGHT": 39,
            "DOWN": 40,
            "INSERT": 45,
            "DELETE": 46
            // TODO: Complete list...
        }
    },

    /**
      Description TODO
      @private
    */
    _shortcutMap: {
        enumerable: false,
        value: {},
        distinct: true
    },

    /**
      Description TODO
      @private
    */
    _target: {
        enumerable: false,
        value: null
    },

    /**
      Description TODO
     Use the shortcuts array to pre-define shortcuts in template, each shortcut is an object with a keys and action property
      @private
    */
    target: {
        enumerable: true,
        set: function(target) {
            this._target = target;
        }
    },

    /**
      Description TODO
     Use the shortcuts array to pre-define shortcuts in template, each shortcut is an object with a keys and action property
      @private
    */
    shortcuts: {
        enumerable: true,
        value: [],
        distinct: true
    },

    /**
      Description TODO
     @type {Function}
    */
    deserializedFromTemplate: {
        enumerable: false,
        value : function() {
            var shortcuts = this.shortcuts,
                nbrShortcuts = shortcuts.length,
                shortcut,
                i;

            for (i  = 0; i < nbrShortcuts; i ++) {
                shortcut = shortcuts[i];
                this.addShortcut(shortcut.keys, shortcut.action);
            }
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    addShortcut: {
        enumerable: true,
        value: function(keys, action) {
            var target = this._target,
                modifiersMap = this._modifiersMap,
                shortcutMap = this._shortcutMap,
                key,
                nbrKeys,
                modifiers = 0,
                i;
            // Make sure we have a valid target
            if (!target || (typeof target != "object" || !target.element) && target != "document" && target != document) {
                console.log("SHORTCUT MANAGER: You need to set a valid target (must be a component with an element) before you can register shortcut");
                return;
            }

            // Initialize the modifiers map if needed
            if (!modifiersMap) {
                modifiersMap = {SHIFT: 1, CTRL: 2, ALT: 4, META: 8};
                modifiersMap.CMD = window.navigator.userAgent.match(/\bmacintosh\b/i) ? modifiersMap.META : modifiersMap.CTRL;
                this._modifiersMap = modifiersMap;
            }

            // Register keydown listener
            if (!this._keydownListenerRegistered) {
                if (target == "document" || target == document) {
                    document.addEventListener("keydown", this);
                } else {
                    target.element.addEventListener("keydown", this);
                }
                this._keydownListenerRegistered = true;
            }

            // Convert the keys into a modifiers mask
            keys = keys.split("+");
            nbrKeys = keys.length;
            for (i = 0; i < nbrKeys - 1; i ++) {
                modifier = keys[i].toUpperCase();
                if (this._modifiersMap[modifier]) {
                    modifiers += this._modifiersMap[modifier];
                }
            }

            // Extra the final key
            key = keys[nbrKeys - 1].toUpperCase();
            if (this._keyNames[key] !== undefined) {
                key = this._keyNames[key];
            } else {
                key = key.charCodeAt(0);
            }

            // Update the shortcutMap
            if (shortcutMap[modifiers] === undefined) {
                shortcutMap[modifiers] = {};
            }
            if (shortcutMap[modifiers][key] === undefined) {
                shortcutMap[modifiers][key] = [action];
            } else {
                shortcutMap[modifiers][key].push(action);
            }
        }
    },

    /**
      Description TODO
     @type {Function}
    */
    removeShortcut: {
        enumerable: true,
        value : function() {
            // TODO: Write Me
        }
    },

    /**
    Description TODO
    @function
    */
    handleKeydown: {
        enumerable: false,
        value: function(event) {
            var keyCode = event.keyCode,
                shortcutMap = this._shortcutMap;
                modifiers = event.shiftKey + (event.ctrlKey << 1) + (event.altKey << 2) + (event.metaKey << 3),
                stopEvent = false;

            // Check the shortcut map
            if (this._shortcutMap[modifiers] && this._shortcutMap[modifiers][keyCode]) {
                var handler = this.handler || this._target,
                    actions = this._shortcutMap[modifiers][keyCode],
                    nbrActions = actions.length,
                    action,
                    i;

                // execute shortcut's action
                for (i = 0; i < nbrActions; i ++) {
                    action = actions[i];
                    if (handler && typeof handler.handleShortcut == "function" && handler.handleShortcut(event, action)) {
                        stopEvent = true;
                        break;
                    }
                }
            }

            if (stopEvent) {
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }
})