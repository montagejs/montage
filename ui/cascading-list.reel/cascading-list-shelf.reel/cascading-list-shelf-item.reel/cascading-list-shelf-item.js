/**
 * @module "ui/cascading-list-shelf-item.reel"
 */
var Component = require("../../../component").Component;

/**
 * @class CascadingListShelfItem
 * @extends Component
 */
exports.CascadingListShelfItem = Component.specialize(/** @lends CascadingListShelfItem.prototype */{

    _templateDidLoad: {
        value: false
    },

    templateDidLoad: {
        value: function () {
            this.defineBindings({
                "_label": {
                    "<-": "data.defined() && userInterfaceDescriptor.defined() ? " +
                        "(data.path(userInterfaceDescriptor.nameExpression) || " +
                        "data) : null"
                }
                
            });
            // FIXME: not safe!
            // https://github.com/montagejs/montage/issues/1977
            this._templateDidLoad = true;
            this._loadDataUserInterfaceDescriptorIfNeeded();
        }
    },

    _label: {
        value: null
    },

    enterDocument: {
        value: function () {
            this.addEventListener("action", this);
        }
    },

    exitDocument: {
        value: function () {
            this.removeEventListener("action", this);
        }
    },
    
    userInterfaceDescriptor: {
        value: null
    },

    handleDeleteAction: {
        value: function () {
            this.cascadingList.removeObjectFromShelf(this.data);
        }
    },

    _loadDataUserInterfaceDescriptorIfNeeded: {
        value: function () {
            if (this.data && this._templateDidLoad) {
                var self = this;

                return this.loadUserInterfaceDescriptor(this.data).then(function (UIDescriptor) {
                    self.userInterfaceDescriptor = UIDescriptor || self.userInterfaceDescriptor; // trigger biddings.

                    self._label = self.callDelegateMethod(
                        "cascadingListShelfItemWillUseLabelForObject",
                        self,
                        self._label,
                        self.data,
                        self.rowIndex,
                        self.list
                    ) || self._label; // defined by a bidding expression
                });
            }
        }
    }

});
