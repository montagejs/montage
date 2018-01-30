var Component = require("../component").Component;

exports.List = Component.specialize({

    /**
     Description TODO
     @private
     */
    _repetition: {
        value: null
    },

    contentController: {
        value: null
    },

    _selection: {
        value: null
    },

    /**
     Description TODO
     @public
     */
    selection: {
        get: function () {
            if (this._contentController) {
                return this._contentController.selection;
            }

            return [];
        }
    },

    /**
     Description TODO
     @public
     */
    isSelectionEnabled: {
        value: false
    },

    /**
     FIXME: can't bind a property already bound! 
     https://github.com/montagejs/montage/issues/1932
     @public
     */
    allowsMultipleSelection: {
        value: false
    },

    /**
     * https://github.com/montagejs/montage/pull/1491
     * Add delegate methods
     */
    delegate: {
        value: null
    }

});
