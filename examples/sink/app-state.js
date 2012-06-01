var Montage = require("montage").Montage;

exports.AppState = Montage.create(Montage, {
    
    selectedItem: {
        serializable: true,
        value: null
    },


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
        value: function() {
            return {
                hash: '#' + this.selectedItem
            };
        }
    },

    updateStateFromUrl: {
        value: function(location) {
            this.selectedItem = this._getHash(location);            
        }
    }

});
