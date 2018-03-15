var Component = require("../component").Component;

exports.List = Component.specialize({

    templateDidLoad: {
        value: function () {
            this.isNavigationEnabled = this.callDelegateMethod(
                "shouldListEnableNavigation",
                this,
                this.isNavigationEnabled,
                this.data
            ) || this.isNavigationEnabled;

            this.isSelectionEnabled = this.callDelegateMethod(
                "shouldListEnableSelection",
                this,
                this.isSelectionEnabled,
                this.data
            ) || this.isSelectionEnabled;

            this.allowsMultipleSelection = this.callDelegateMethod(
                "shouldListAllowMultipleSelectionn",
                this,
                this.allowsMultipleSelection,
                this.data
            ) || this.allowsMultipleSelection;
        }
    },

    /**
     * Description TODO
     * @private
     */
    _repetition: {
        value: null
    },

    /**
     * Description TODO
     * @public
     */
    userInterfaceDescriptor: {
        value: null
    },

    /**
     * Description TODO
     * @public
     */
    data: {
        value: null
    },

    /**
     * Description TODO
     * @public
     */
    isNavigationEnabled: {
        value: false
    },

     /**
     * Description TODO
     * @public
     */
    isSelectionEnabled: {
        value: false
    },

    /**
     * Description TODO
     * @public
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
