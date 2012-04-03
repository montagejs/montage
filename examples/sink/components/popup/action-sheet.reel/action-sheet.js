var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var Notifier = require("montage/ui/popup/notifier.reel").Notifier;

exports.ActionSheet = Montage.create(Component, {
    hasTemplate: {value: true},

    draw: {
        value: function() {
        }
    },

    // will be set by the popup when it is displayed
    popup: {value: null},

    close: {
        value: function() {
            if(this.popup) {
                this.popup.hide();
            }
        }
    },

    handleEmailAction: {
        value: function(evt) {
            console.log('sent by email');
            Notifier.show('Email sent to user', 2000);
            this.close();
        }
    },
    handleFacebookAction: {
        value: function(evt) {
            console.log('sent by facebook');
            Notifier.show('User sent a message on Facebook', 2000);
            this.close();
        }
    },
    handleTextMessageAction: {
        value: function(evt) {
            console.log('text message');
            Notifier.show('User notified via text message', 2000);
            this.close();
        }
    },
    handleTweetAction: {
        value: function(evt) {
            console.log('sent by twitter');
            Notifier.show('User DMd on Twitter', 2000);
            this.close();
        }
    },
    handleCallAction: {
        value: function(evt) {
            console.log('call');
            Notifier.show('Voice mail left for user', 2000);
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
