var Montage = require("montage").Montage;

exports.AppDelegate = Montage.create(Montage, {


    // Utility methods to deal with URL
    _getHash: {
        value: function() {
            var hash = window.location.hash;
            if(hash && hash.length > 0 && hash.indexOf('#') == 0) {
                hash = hash.substring(hash.indexOf('#')+1);
            }
            return hash;
        }
    },

    // Delegate methods to manage Application State
    getUrlFromState: {
        value: function(state) {
            return {
                hash: '#' + state.selectedItem
            };
        }
    },

    getStateFromUrl: {
        value: function(location) {
            return {
                selectedItem: this._getHash(location)
            };
        }
    }

});
