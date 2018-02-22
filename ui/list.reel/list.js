var Component = require("../component").Component;

exports.List = Component.specialize({

    templateDidLoad: {
        value: function () {
            this.addPathChangeListener(
                "context.selectedObject", this, "handleSelectedObjectChange"
            );

            this.isNavigationEnabled = this.callDelegateMethod(
                "shouldListEnableNavigation",
                this,
                this.isNavigable
            ) || this.isNavigable;
        }
    },

    isNavigationEnabled: {
        value: false
    },

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
    },

    handleSelectedObjectChange: {
        value: function (value) {
            if (this._repetition && this._repetition.selection) {
                if (value) {
                    if (this._repetition.selection.indexOf(value) === -1) {
                        this._repetition.selection.clear();
                        this._repetition.selection.push(value);
                    }
                } else if (this._repetition.selection.length) {
                    this._repetition.selection.clear();
                }
            }

            // odd issue although the change is detected the value selectedObject 
            // is not updated.
            this.context.selectedObject = value;
        }
    }

});
