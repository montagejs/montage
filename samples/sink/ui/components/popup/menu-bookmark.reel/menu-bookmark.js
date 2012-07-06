/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var Notifier = require("montage/ui/popup/notifier.reel").Notifier;
var Popup = require("montage/ui/popup/popup.reel").Popup;
var ActionSheet = require("ui/components/popup/action-sheet.reel").ActionSheet;

exports.MenuBookmark = Montage.create(Component, {

    label: {
        value: null
    },

    title: {
        value: 'Information'
    },

    popup: {value: null},

    close: {
        value: function() {
            if(this.popup) {
                this.popup.hide();
            }
        }
    },


    draw: {
        value: function() {
        }
    },

    actionSheet: {
        value: null
    },

    _actionSheetPopup: {value: null},

    btnActionSheet: {
        value: null
    },

    handleAddbookmarkAction: {
        value: function(evt) {
            console.log('add bookmark action');
            var anEvent = document.createEvent("CustomEvent");
            anEvent.initCustomEvent("addbookmark", true, true, 'Bookmark Added - ' + this.label);

            this.dispatchEvent(anEvent);
            Notifier.show('Bookmark Added', 2000, {top: 1, right: 10});
        }
    },

    handleAddandfavoriteAction: {
        value: function(value) {
            console.log('add and favorite action');
            var anEvent = document.createEvent("CustomEvent");
            anEvent.initCustomEvent("addAndFavBookmark", true, true, 'Bookmark Added and Favorited - ' + this.label);

            this.dispatchEvent(anEvent);

            Notifier.show('Bookmark Added and favorited', 2000, {top: 1, right: 10});
        }
    },


    handleShowActionSheetAction: {
        value: function(value) {
            var popup = this._actionSheetPopup;
            if(!popup) {
                popup = Popup.create();
                popup.type = 'bookmark-action-sheet';
                //popup.modal = true;
                popup.content = this.actionSheet;
                //popup.anchor = this.btnActionSheet;
                this._actionSheetPopup = popup;
            }
            this._actionSheetPopup.show();
            this.close();
        }
    },


    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
    }

});
