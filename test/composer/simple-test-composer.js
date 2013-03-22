var Montage = require("montage").Montage,
    Composer = require("montage/composer/composer").Composer;

exports.SimpleTestComposer = Montage.create(Composer, {

    _loadWasCalled: {
        value: false
    },

    load: {
        value: function() {
            this._loadWasCalled = true;
        }
    },

    unload: {
        value: function() {

        }
    },

    frame: {
        value: function(timestamp) {

        }
    }

});

exports.LazyLoadTestComposer = Montage.create(Composer, {

    lazyLoad: {
        value: true
    },

    _loadWasCalled: {
        value: false
    },

    load: {
        value: function() {
            this._loadWasCalled = true;
        }
    },

    unload: {
        value: function() {

        }
    },

    frame: {
        value: function(timestamp) {

        }
    }

});
