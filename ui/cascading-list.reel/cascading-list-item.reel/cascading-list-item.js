var Component = require("../../component").Component;

/**
 * @class CascadingListItem
 * @extends Component
 */
var CascadingListItem = exports.CascadingListItem = Component.specialize({

    _context: {
        value: null
    },

    context: {
        get: function () {
            return this._context;
        },
        set: function (context) {
            if (this._context !== context) {
                var componentModule = null;

                if (context) {
                    var UIDescriptor = context.userInterfaceDescriptor,
                        object = context.object;

                    context.cascadingListItem = this;

                    this.isCollection = Array.isArray(object);
                    this.userInterfaceDescriptor = UIDescriptor;

                    if (UIDescriptor) {
                        if (this.isCollection) {
                            componentModule = (
                                UIDescriptor.collectionInspectorComponentModule ||
                                CascadingListItem.defaultCollectionModule
                            );
                        } else {
                            componentModule = UIDescriptor.inspectorComponentModule;
                        }
                        
                        // delegate method creator
                    }
                }

                this._context = context;
                this.componentModule = componentModule;
            }
        }
    },


    isCollection: {
        value: false
    },


    componentModule: {
        value: null
    },


    _selectedObject: {
        value: void 0
    },

    selectedObject: {
        get: function () {
            return this._selectedObject;
        },
        set: function (selectedObject) {
            if (this._selectedObject !== selectedObject) {
                this._selectedObject = selectedObject;

                if (this.context) {
                    if (selectedObject) {
                        this.cascadingList.expand(
                            selectedObject,
                            this.context.columnIndex + 1
                        );
                    } else if (
                        this.context.columnIndex < this.cascadingList._currentIndex
                    ) {
                        this.cascadingList.popAtIndex(
                            this.context.columnIndex + 1,
                            this._isResetting
                        );
                    }
                }
            }
        }
    },

    resetSelectedObject: {
        value: function () {
            this.selectedObject = null;

            if (this.content &&
                this.content.component &&
                this.content.component.selectedObject
            ) {
                this.content.component.selectedObject = null;
            }
        }
    }

}, {
    defaultCollectionModule: {
        value: {
            id: '../../list.reel',
            require: require
        }
    }    
});
