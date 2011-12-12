
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var Notifier = require("montage/ui/popup/notifier.reel").Notifier;

exports.MenuBookmark = Montage.create(Component, {
    hasTemplate: {value: true},

    label: {
        value: null
    },

    title: {
        value: 'Information'
    },


    draw: {
        value: function() {
        }
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
    }

});
