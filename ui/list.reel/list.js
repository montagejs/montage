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
