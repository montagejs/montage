/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module "montage/ui/popup/alert.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires "montage/ui/popup/popup.reel"
*/

var Montage = require("montage").Montage;
var Component = require("ui/component").Component;
var Popup = require("ui/popup/popup.reel").Popup;

/**
 @class module:"montage/ui/popup/alert.reel".Alert
 @extends module:montage/ui/component.Component
 */

var Alert = exports.Alert = Montage.create(Component, {
    title: {
        value: 'Alert'
    },
/**
        Description TODO
        @type {Property}
        @default {String} ''
    */
    msg: {
        value: ''
    },
/**
        Description TODO
        @type {Property}
        @default {String} ''
    */
    details: {
        value: ''
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

    prepareForDraw: {
        value: function() {
            this.element.addEventListener("keyup", this, false);
        }
    },
/**
    Description TODO
    @function
    @param {Event} evt The event keyCode.
    */
    handleKeyup: {
        value: function(evt) {
            if (evt.keyCode == 13 /*Enter*/ ||
                    evt.keyCode == 27 /*Escape*/) {

                this.handleOkAction(evt);
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
            anEvent.initCustomEvent("montage_alert_ok", true, true, null);

            this.dispatchEvent(anEvent);
            this.popup.hide();
        }
    },

    // Static method to show an Alert dialog
    /**
     Displays an Alert dialog with a OK button.
     @function
     @param {String} msg A message to display in the dialog.
     @param {Function} okCallback Function that's invoked when the user clicks OK
     @example
     ...
     */
    show: {
        value: function(msg, okCallback) {
            var popup = this.application._alertPopup, alert;
            if(!popup) {
                popup = Popup.create();
                this.popup = popup;

                popup.type = 'alert';
                popup.title = 'Message';
                popup.modal = true;
                this.application._alertPopup = popup;

                alert = Alert.create();
                popup.content = alert;
            }
            alert = popup.content;
            alert.msg = msg;
            alert.okCallback = okCallback || null;
            popup.show();
        }
    }
});

