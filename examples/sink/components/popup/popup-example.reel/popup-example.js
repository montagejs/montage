var Montage = require("montage").Montage,
Component = require("montage/ui/component").Component,
Popup = require("montage/ui/popup/popup.reel").Popup,
Alert = require("montage/ui/popup/alert.reel").Alert,
Confirm = require("montage/ui/popup/confirm.reel").Confirm,
Notifier = require("montage/ui/popup/notifier.reel").Notifier;

exports.PopupExample = Montage.create(Component, {
    
    logger: {value: null},

    log: {
        value: function(msg) {
            this.logger.log(msg);
        }
    },
    

    // Bookmark
    handleAddbookmark: {
        value: function(e) {
            this.log('Bookmark added = ' + this.bookmarkMenu.label);
            this._bookmarkMenuPopup.hide();
        }
    },
    handleAddAndFavBookmark: {
        value: function(e) {
            this.log('Bookmark added and favorited = ' + this.bookmarkMenu.label);
            this._bookmarkMenuPopup.hide();
        }
    },
    _bookmarkMenuPopup: {value: null},
    handleShowBookmarkMenuAction: {
        value: function(evt) {
            var popup = this._bookmarkMenuPopup;
            if(!popup) {
                popup = Popup.create();
                popup.modal = true;
                popup.content = this.bookmarkMenu;
                popup.anchor = this.btnBookmark;
                this._bookmarkMenuPopup = popup;

                this.bookmarkMenu.addEventListener('addbookmark', this);
                this.bookmarkMenu.addEventListener('addAndFavBookmark', this);
            }
            popup.show();
            evt.stopPropagation();
        }
    },

    // Custom Alert/Message
    handleMessage_reply: {
        value: function(e) {
            this.log(e.detail);
            this.messagePopup.hide();
        }
    },
    handleMessage_close: {
        value: function(e) {
            this.log(e.detail);
            this.messagePopup.hide();
        }
    },
    handleShowMessagePopupAction: {
        value: function(evt) {
            var self = this, popup = this.messagePopup;
            if(!popup) {
                popup = Popup.create();
                popup.content = this.customMessage;
                popup.anchor = this.btnShowMessage;

                this.messagePopup = popup;

                this.customMessage.addEventListener('message_reply', this);
                this.customMessage.addEventListener('message_close', this);
            }

            popup.show();
            evt.stopPropagation();
        }
    },

    // Critical Error Dialog
    _criticalErrorPopup: {value: null},
    handleMessage_restart: {
        value: function(e) {
            var self = this;
            if(Confirm.show('Are you sure?', function() {
                self.log('User clicked Restart');
                self._criticalErrorPopup.hide();
            }));
        }
    },
    handleShowCriticalErrorAction: {
        value: function(evt) {
            var self = this, popup = this._criticalErrorPopup;
            if(!popup) {
                popup = Popup.create();
                popup.content = this.criticalError;
                popup.anchor = this.btnCriticalError;
                popup.modal = true;
                this._criticalErrorPopup = popup;

                this.criticalError.addEventListener('message_restart', this);
            }

            popup.show();
            evt.stopPropagation();
        }
    },


    // Default Alert
    handleShowAlertAction: {
        value: function(evt) {

            var self = this;
            Alert.show('We were unable to process your request. Please try again later.', function() {
                self.log("User clicked OK on the alert dialog");
            });

        }
    },

    startLoading: {
        value: function() {
            Notifier.show('Loading ... please wait', null, {top: 1, right: 10});
        }
    },

    stopLoading: {
        value: function() {
            Notifier.hide();
        }
    },

    handleShowLoadingAction: {
        value: function(evt) {
            var self = this;
            this.log('Starting a long running transaction...');
            self.startLoading('Loading... please wait');
            setTimeout(function() {
                self.log('.. and we are done.');
                self.stopLoading();
            }, 3000);

            evt.stopPropagation();
        }
    },

    handleShowNotifierAction: {
        value: function(evt) {
            var self = this,
            app = this.application,
            msg = 'Unable to reach the server. Retrying in ';

            Notifier.show(msg + ' 5s');

            var count = 5;
            var intId = setInterval(function() {
                Notifier.show(msg + count + 's');
                count--;
                if(count == 0) {
                    Notifier.show('Successfully connected to server.');
                }
                if(count < 0) {
                    clearInterval(intId);
                    Notifier.hide();
                }
            }, 1000);
            evt.stopPropagation();
        }
    },

    handleShowConfirmAction: {
        value: function(evt) {
            var self = this;

            Confirm.show('Are you sure?', function() {
                self.log("User clicked on OK");
                Notifier.show('Item deleted from List', 2000);
            }, function() {
                self.log("User clicked on Cancel");
            });

            evt.stopPropagation();
        }
    },


    draw: {
        value: function() {
            if(!this.firstDraw) {
                var self = this;
                var eventManager = this.eventManager;

                var log = function(evt) {
                    self.log(evt.detail);
                };

                eventManager.addEventListener('addbookmark', log);
                eventManager.addEventListener('addAndFavBookmark', log);
                eventManager.addEventListener('restartDevice', log);
                eventManager.addEventListener('message.close', log);
                eventManager.addEventListener('message.reply', log);

                // ActionSheet

                var btnMenu = document.querySelector('.action-show-settings-menu');

                var menuPopup = Popup.create();
                menuPopup.content = this.bookmarkMenu2;
                menuPopup.anchor = btnMenu;

                btnMenu.addEventListener('click', function(evt) {
                    evt.preventDefault();
                    menuPopup.show();
                }, false);

                var btnActionSheet = document.querySelector('.action-show-action-sheet');
                var asPopup = Popup.create();
                asPopup.content = this.actionSheet;
                asPopup.anchor = btnActionSheet;
                btnActionSheet.addEventListener('click', function(evt) {
                    evt.preventDefault();
                    asPopup.show();
                }, false);

                this.firstDraw = true;

            }

        }
    },

    deserializedFromTemplate: {
        value: function() {
            this.addEventListener("action", this);
        }
    },

    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
    }

});
