var Component = require("../component").Component;

exports.List = Component.specialize({

    _templateDidLoad: {
        value: false
    },

    templateDidLoad: {
        value: function () {
            this.defineBindings({
                "_ignoreSelectionAfterLongPress": {
                    "<-": "userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.listIgnoreSelectionAfterLongPress || " +
                        "ignoreSelectionAfterLongPress) : ignoreSelectionAfterLongPress"
                },
                "_isExpandable": {
                    "<-": "userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.listIsExpandable || " +
                        "isExpandable) : isExpandable"
                },
                "_isSelectionEnabled": {
                    "<-": "userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.listIsSelectionEnabled || " +
                        "isSelectionEnabled) : isSelectionEnabled"
                },
                "_allowsMultipleSelection": {
                    "<-": "userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.listAllowsMultipleSelection || " +
                        "allowsMultipleSelection) : allowsMultipleSelection"
                }
            });

            //FIXME: not safe!
            this._templateDidLoad = true;
            this._loadDataUserInterfaceDescriptorIfNeeded();
        }
    },

    _data: {
        value: null
    },

    /**
     * Description TODO
     * @public
     */
    data: {
        get: function () {
            return this._data;
        },
        set: function (data) {
            if (this._data !== data) {
                this._data = data;
                this._loadDataUserInterfaceDescriptorIfNeeded();
            }
        }
    },

    /**
     * Description TODO
     * @public
     */
    ignoreSelectionAfterLongPress: {
        value: false
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
    },

    _loadDataUserInterfaceDescriptorIfNeeded: {
        value: function () {
            if (this.data && this._templateDidLoad) {
                var self = this;

                return this.loadUserInterfaceDescriptor(this.data).then(function (UIDescriptor) {
                    self.userInterfaceDescriptor = UIDescriptor || self.userInterfaceDescriptor; // trigger biddings.

                    self._isExpandable = self.callDelegateMethod(
                        "shouldListBeExpandable",
                        self,
                        self._isExpandable,
                        self.data
                    ) || self._isExpandable;

                    self._isSelectionEnabled = self.callDelegateMethod(
                        "shouldListEnableSelection",
                        self,
                        self._isSelectionEnabled,
                        self.data
                    ) || self._isSelectionEnabled;

                    self._allowsMultipleSelection = self.callDelegateMethod(
                        "shouldListAllowMultipleSelection",
                        self,
                        self._allowsMultipleSelection,
                        self.data
                    ) || self._allowsMultipleSelection;

                    self._ignoreSelectionAfterLongPress = self.callDelegateMethod(
                        "shouldListIgnoreSelectionAfterLongPress",
                        self,
                        self._ignoreSelectionAfterLongPress,
                        self.data
                    ) || self._ignoreSelectionAfterLongPress;
                });
            }
        }
    }

});
