var Component = require("../component").Component;

exports.List = Component.specialize({

    templateDidLoad: {
        value: function () {
            this.isExpandable = this.callDelegateMethod(
                "shouldListBeExpandable",
                this,
                this.isExpandable,
                this.data
            ) || this.isExpandable;

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
