var Component = require("../../component").Component;

/**
 * @class CascadingListItem
 * @extends Component
 */
var CascadingListItem = exports.CascadingListItem = Component.specialize({

    constructor: {
        value: function () {
            this.defineBindings({
                "shouldHideFooter": {
                    "<-": "isCollection ? " +
                        "!(userInterfaceDescriptor.cascadingListItemFooterLeftCollectionNameExpression.defined() || " +
                        "userInterfaceDescriptor.cascadingListItemFooterMiddleCollectionNameExpression.defined() || " +
                        "userInterfaceDescriptor.cascadingListItemFooterRightCollectionNameExpression.defined()) : " +
                        "!(userInterfaceDescriptor.cascadingListItemFooterLeftNameExpression.defined() || " +
                        "userInterfaceDescriptor.cascadingListItemFooterMiddleNameExpression.defined() || " +
                        "userInterfaceDescriptor.cascadingListItemFooterRightNameExpression.defined())"
                },
                "headerLeftLabel": {
                    "<-": "isCollection ? " +
                        "(object.path(userInterfaceDescriptor.cascadingListItemHeaderLeftCollectionNameExpression || \"''\") || " +
                        "path(userInterfaceDescriptor.cascadingListItemHeaderLeftCollectionNameExpression || \"''\")) : " +
                        "(object.path(userInterfaceDescriptor.cascadingListItemHeaderLeftNameExpression || \"''\") || " +
                        "path(userInterfaceDescriptor.cascadingListItemHeaderLeftNameExpression || \"''\"))"
                },
                "headerMiddleLabel": {
                    "<-": "isCollection ? " +
                        "(object.path(userInterfaceDescriptor.cascadingListItemHeaderMiddleCollectionNameExpression || " +
                        "userInterfaceDescriptor.collectionNameExpression || \"''\") || " +
                        "path(userInterfaceDescriptor.cascadingListItemHeaderMiddleCollectionNameExpression || " +
                        "userInterfaceDescriptor.collectionNameExpression || \"''\")) : " +
                        "(object.path(userInterfaceDescriptor.cascadingListItemHeaderMiddleNameExpression || " +
                        "userInterfaceDescriptor.nameExpression || \"''\") || " +
                        "path(userInterfaceDescriptor.cascadingListItemHeaderMiddleNameExpression || " +
                        "userInterfaceDescriptor.nameExpression || \"''\"))"
                },
                "headerRightLabel": {
                    "<-": "isCollection ? " +
                        "(object.path(userInterfaceDescriptor.cascadingListItemHeaderRightCollectionNameExpression || \"''\") || " +
                        "path(userInterfaceDescriptor.cascadingListItemHeaderRightCollectionNameExpression || \"''\")) : " +
                        "(object.path(this.userInterfaceDescriptor.cascadingListItemHeaderRightNameExpression || \"''\") || " +
                        "path(userInterfaceDescriptor.cascadingListItemHeaderRightNameExpression || \"''\"))"
                },
                "footerLeftLabel": {
                    "<-": "isCollection ? " +
                        "(object.path(userInterfaceDescriptor.cascadingListItemFooterLeftCollectionNameExpression || \"''\") || " +
                        "path(userInterfaceDescriptor.cascadingListItemFooterLeftCollectionNameExpression || \"''\")) : " +
                        "(object.path(userInterfaceDescriptor.cascadingListItemFooterLeftNameExpression || \"''\") || " +
                        "path(userInterfaceDescriptor.cascadingListItemFooterLeftNameExpression || \"''\"))"
                },
                "footerMiddleLabel": {
                    "<-": "isCollection ? " +
                        "(object.path(userInterfaceDescriptor.cascadingListItemFooterMiddleCollectionNameExpression) || " +
                        "path(userInterfaceDescriptor.cascadingListItemFooterMiddleCollectionNameExpression || \"''\")) : " +
                        "(object.path(userInterfaceDescriptor.cascadingListItemMiddleRightNameExpression || \"''\") || " +
                        "path(userInterfaceDescriptor.cascadingListItemFooterMiddleNameExpression || \"''\"))"
                },
                "footerRightLabel": {
                    "<-": "isCollection ? " +
                        "(object.path(userInterfaceDescriptor.cascadingListItemFooterRightCollectionNameExpression || \"''\") || " +
                        "path(userInterfaceDescriptor.cascadingListItemFooterRightCollectionNameExpression || \"''\")) : " +
                        "(object.path(userInterfaceDescriptor.cascadingListItemFooterRightNameExpression || \"''\") || " +
                        "path(userInterfaceDescriptor.cascadingListItemFooterRightNameExpression || \"''\"))"
                }
            });
        }
    },

    _context: {
        value: null
    },

    context: {
        get: function () {
            return this._context;
        },
        set: function (context) {
            if (this._context !== context ||
                (context && this._context && this._context.object !== context.object)
            ) {
                var componentModule = null;
                this._context = context;

                if (context) {
                    var UIDescriptor = context.userInterfaceDescriptor,
                        object = object = context.object;

                    context.cascadingListItem = this;

                    this.isCollection = Array.isArray(object);
                    this.userInterfaceDescriptor = UIDescriptor;
                    this.object = object;

                    if (UIDescriptor) {
                        if (this.isCollection) {
                            componentModule = (
                                UIDescriptor.collectionInspectorComponentModule ||
                                CascadingListItem.defaultCollectionModule
                            );
                        } else {
                            componentModule = UIDescriptor.inspectorComponentModule;
                        }
                        
                        componentModule = this.callDelegateMethod(
                            "cascadingListWillUseInspectorComponentModuleForObjectAtColumnIndex",
                            context.cascadingList,
                            componentModule,
                            object,
                            context.columnIndex,
                            context
                        ) || componentModule;
                    }
                } else {
                    this.object = null;
                }

                this.componentModule = componentModule;
            }
        }
    },

    shouldHideFooter: {
        value: true,
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
                        this.cascadingList.popAtIndex(this.context.columnIndex + 1);
                    }
                }
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
