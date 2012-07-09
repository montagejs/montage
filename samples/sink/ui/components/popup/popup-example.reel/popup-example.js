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
var Montage = require("montage").Montage,
Component = require("montage/ui/component").Component,
Popup = require("montage/ui/popup/popup.reel").Popup,
Alert = require("montage/ui/popup/alert.reel").Alert,
Confirm = require("montage/ui/popup/confirm.reel").Confirm,
Notifier = require("montage/ui/popup/notifier.reel").Notifier;

exports.PopupExample = Montage.create(Component, {

    logger: {
        value: null
    },

    criticalError: {
        value: null
    },

    btnCriticalError: {
        value: null
    },

    bookmarkMenu: {
        value: null
    },

    bookmarkMenu2: {
        value: null
    },

    actionSheet: {
        value: null
    },

    btnBookmark: {
        value: null
    },




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
                popup.content = this.bookmarkMenu;
                popup.anchor = this.btnBookmark;
                // custom positioning support
                popup.delegate = this;
                this._bookmarkMenuPopup = popup;

                this.bookmarkMenu.addEventListener('addbookmark', this);
                this.bookmarkMenu.addEventListener('addAndFavBookmark', this);
            }
            popup.show();
            evt.stopPropagation();
        }
    },

    menuPosition: {value: 'default'},
    // delegate for the Bookmark menu popup
    willPositionPopup: {
        value: function(popup, defaultPosition) {
            var anchor = popup.anchorElement, anchorHt = 0, anchorWd = 0, contentHt = 0, contentWd = 0;
            if(anchor) {
                anchorHt = parseFloat(anchor.style.height || 0) || anchor.offsetHeight || 0;
                anchorWd = parseFloat(anchor.style.width || 0) || anchor.offsetWidth || 0;
            }
            var content = popup.content.element;
            contentHt = parseFloat(content.style.height || 0) || content.offsetHeight || 0;
            contentWd = parseFloat(content.style.height || 0) || content.offsetHeight || 0;

            var result;
            switch(this.menuPosition) {
                case 'left':
                result = {
                    top: defaultPosition.top,
                    left: defaultPosition.left - (anchorWd/2 + contentWd/2)
                };
                break;

                case 'right':
                result = {
                    top: defaultPosition.top,
                    left: defaultPosition.left + (anchorWd/2 + contentWd/2)
                };
                break;

                case 'top':
                result = {
                    top: defaultPosition.top - (anchorHt + contentHt + 10),
                    left: defaultPosition.left
                };
                break;

                case 'bottom':
                result = defaultPosition;
                break;

                case 'topright':
                result = {
                  top: 1,
                  right: 2
                };
                break;

                case 'topcenter':
                result = {
                  top: 1,
                  left: '40%'
                };
                break;

                case 'bottomcenter':
                result = {
                  bottom: 1,
                  left: '40%'
                };
                break;

                case 'bottomleft':
                result = {
                  bottom: '1px',
                  left: '10px'
                };
                break;

                case 'center':
                result = {
                    top: '40%',
                    left: '40%'
                };
                break;


                default:
                result = defaultPosition;


            }
            return result;

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

            Notifier.show(msg + ' 2 seconds');

            var count = 2;
            var intId = setInterval(function() {
                //Notifier.show(msg + count + 's');
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
