var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var Notifier = require("montage/ui/popup/notifier.reel").Notifier;

exports.ActionSheet = Montage.create(Component, {
    hasTemplate: {value: true},

    draw: {
        value: function() {
        }
    },

    handleEmailAction: {
        value: function(evt) {
            console.log('sent by email');
            Notifier.show('Email sent to user', 2000);
        }
    },
    handleFacebookAction: {
        value: function(evt) {
            console.log('sent by facebook');
            Notifier.show('User sent a message on Facebook', 2000);
        }
    },
    handleTextMessageAction: {
        value: function(evt) {
            console.log('text message');
            Notifier.show('User notified via text message', 2000);
        }
    },
    handleTweetAction: {
        value: function(evt) {
            console.log('sent by twitter');
            Notifier.show('User DMd on Twitter', 2000);
        }
    },
    handleCallAction: {
        value: function(evt) {
            console.log('call');
            Notifier.show('Voice mail left for user', 2000);
        }
    }
});
