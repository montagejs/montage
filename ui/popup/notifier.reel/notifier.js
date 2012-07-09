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
    @module "montage/ui/popup/notifier.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires "montage/ui/popup/popup.reel"
*/
var Montage = require("montage").Montage;
var Component = require("ui/component").Component;
var Popup = require("ui/popup/popup.reel").Popup;

/**
 @class module:"montage/ui/popup/notifier.reel".Notifier
 @extends module:montage/ui/component.Component
 */

var Notifier = exports.Notifier = Montage.create(Component, /** @lends module:"montage/ui/popup/notifier.reel".Notifier# */ {

    _msgEl: {
        value: null
    },
/**
  Description TODO
  @private
*/
    _msg: {value: null},
/**
        Description TODO
        @type {Function}
        @default null
    */
    msg: {
        get: function() {
            return this._msg;
        },
        set: function(value) {
            if (this._msg !== value) {
                this._msg = value;
                this.needsDraw = true;
            }
        }
    },
/**
        Description TODO
        @type {Property}
        @default {String} null
    */
    details: {
        value: null
    },
/**
    Description TODO
    @function
    */
    draw: {
        value: function() {
            this._msgEl.textContent = this.msg;
        }
    },

    // Static method to show a Notify dialog
     /**
      Displays a small Growl-like notification in a pop-up dialog. The notification can have a timeout that determines how long it appears before being hidden automatically.
      You can also specify the location of the notification in the browser window (top-left corner, by default).
      @function
      @param {String} msg A message to display in the notification.
      @param {Number} timeout The number of milliseconds to display the notification before it is hidden.
      @param {Object} Contains two properties named top and left that specify top and left coordinates of the notifiction. By default, notifications are positioned at the top-left corner of the window.
      */
    show: {
        value: function(msg, timeout, position) {
            var popup = this.application._notifyPopup, notifier;
            if(!popup) {
                popup = Popup.create();
                this.popup = popup;
                popup.type = 'notify';
                this.application._notifyPopup = popup;

                notifier = Notifier.create();
                popup.content = notifier;
            }
            notifier = popup.content;
            notifier.msg = msg;

            if (!position) {
                // position at the top by default
                var viewportWidth = window.innerWidth;
                position = {
                    top: 1,
                    right: 10
                };
            }
            popup.position = position;

            if(timeout) {
                timeout = parseInt(timeout, 10) || 3000;
                popup.autoHide = timeout;
            }

            popup.show();


        }
    },

    hide: {
        value: function() {
            var popup = this.application._notifyPopup;
            if(popup) {
                popup.hide();
            }
        }
    }

});
