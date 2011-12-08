/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module "montage/ui/popup/confirm.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires "montage/ui/popup/popup.reel"
*/

var Montage = require("montage").Montage;
var Component = require("ui/component").Component;
var Popup = require("ui/popup/popup.reel").Popup;

/**
 @class module:"montage/ui/popup/confirm.reel".Confirm
 @extends module:montage/ui/component.Component
 */

var Confirm = exports.Confirm = Montage.create(Component, /** @lends module:"montage/ui/popup/confirm.reel".Confirm# */ {
    hasTemplate: {value: true},

    title: {
        value: 'Confirm'
    },
    /**
        Text of message to display on the confirm popup
        @type {Property}
        @default {String} 'Are you sure?'
    */
    msg: {
        value: 'Are you sure?'
    },
    
    /**
        Text to display on the OK button
        @type {Property}
        @default {String} 'OK'
    */
    okValue: {
        value: 'OK'
    },
    
    /**
        Text to display on the Cancel button
        @type {Property}
        @default {String} 'Cancel'
    */
    cancelValue: {
        value: 'Cancel'
    },
    
/**
  Description TODO
  @private
*/
    _popup: {
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    popup: {
        set: function(value) {
            this._popup = value;
        },
        get: function() {
            return this._popup;
        }
    },

    okCallback: {value: null},
    cancelCallback: {value: null},

    prepareForDraw: {
        value: function() {
            this.element.addEventListener("keyup", this, false);
        }
    },
/**
    Description TODO
    @function
    */
    draw: {
        value: function() {
        }
    },
/**
    Description TODO
    @function
    @param {Event} evt The event keyCode.
    */
    handleKeyup: {
        value: function(evt) {
            if (evt.keyCode == 13 /*Enter*/) {
                this.handleOkAction(evt);
            } else if (evt.keyCode == 27 /*Escape*/) {
                this.handleCancelAction(evt);
            }
        }
    },
/**
    Description TODO
    @function
    @param {Event} evt The event keyCode.
    */
    handleOkAction: {
        value: function(evt) {
            if(this.okCallback) {
                this.okCallback.call(this, evt);
            }
            var anEvent = document.createEvent("CustomEvent");
            anEvent.initCustomEvent("montage_confirm_ok", true, true);
            this.dispatchEvent(anEvent);

            this.popup.hide();
        }
    },
 /**
    Description TODO
    @function
    @param {Event} evt The event keyCode.
    */
    handleCancelAction: {
        value: function(evt) {
            if(this.cancelCallback) {
                this.cancelCallback.call(this, evt);
            }
            var anEvent = document.createEvent("CustomEvent");
            anEvent.initCustomEvent("montage_confirm_cancel", true, true);
            this.dispatchEvent(anEvent);

            this.popup.hide();
        }
    },

    // Static method to show a Confirmation dialog
    /**
     Displays a confirm dialog with OK and Cancel buttons.
     @function
     @param {String} msg A message to display in the dialog.
     @param {Function} okCallback Function that's invoked when the user clicks OK
     @param {Function} cancelCallback Function that's invoked if the user clicks Cancel.
     @example
     ...
     */
    show: {
        value: function(options, okCallback, cancelCallback) {
            var popup = this.application._confirmPopup, confirm,
                msg, okValue, cancelValue;
            if(!popup) {
                popup = Popup.create();
                this.popup = popup;

                popup.type = 'confirm';
                popup.title = 'Confirmation';
                popup.modal = true;
                this.application._confirmPopup = popup;

                confirm = Confirm.create();
                popup.content = confirm;
            }
            
            if (typeof(options) === "string") {
                msg = options;
            } else {
                msg = options.message;
                okValue = options.okValue;
                cancelValue = options.cancelValue;
            }
            
            confirm = popup.content;
            confirm.msg = msg;
            confirm.okValue = okValue || "OK";
            confirm.cancelValue = cancelValue || "Cancel";
            confirm.okCallback = okCallback || null;
            confirm.cancelCallback = cancelCallback || null;

            popup.show();
        }
    }
});
