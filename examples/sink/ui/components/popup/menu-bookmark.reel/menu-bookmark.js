
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
