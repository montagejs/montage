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

