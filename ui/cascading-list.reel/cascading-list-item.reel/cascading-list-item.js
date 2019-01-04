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
                        "object.path(userInterfaceDescriptor.cascadingListItemHeaderMiddleNameExpression || " +
                        "userInterfaceDescriptor.nameExpression || \"''\")"
                },
                "_headerRightLabelObjectExpression": {
                    "<-": "!isCollection ? " +
                        "object.path(userInterfaceDescriptor.cascadingListItemHeaderRightNameExpression) : ''"
                },
                "_headerRightLabelExpression": {
                    "<-": "!isCollection ? " +
                        "path(userInterfaceDescriptor.cascadingListItemHeaderRightNameExpression) : ''"
                },
                "__headerRightLabelExpression": {
                    "<-": "_headerRightLabelExpression || _headerRightLabelObjectExpression"
                },
                "headerRightLabel": {
                    "<-": "isCollection ? " +
                        "(object.path(userInterfaceDescriptor.cascadingListItemHeaderRightCollectionNameExpression || \"''\") || " +
                        "path(userInterfaceDescriptor.cascadingListItemHeaderRightCollectionNameExpression || \"''\")) : " +
                        "__headerRightLabelExpression"
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

            this.addRangeAtPathChangeListener("selection", this, "_handleSelectionChange");
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
                        object = context.object;

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

    selectObject: {
        value: function (object) {
            if (this.isCollection && this.selection[0] !== object) {
                this.selection.clear();

                if (this.context.object.indexOf(object) > -1) {
                    this.selection.push(object);
                }
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

    selection: {
        value: null
    },

    _handleSelectionChange: {
        value: function (plus, minus, index) {
            if (plus && plus.length === 1) {
                this.cascadingList.expand(
                    plus[0],
                    this.context.columnIndex + 1
                );
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
