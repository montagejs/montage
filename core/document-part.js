var Montage = require("./core").Montage,
    logger = require("./logger").logger("document-part"),
    Promise = require("./promise").Promise,
    defaultEventManager = require("./event/event-manager").defaultEventManager;

var DocumentPart = Montage.specialize({
    parentDocumentPart: {value: null},
    template: {value: null},
    fragment: {value: null},
    objects: {value: null},
    childComponents: {value: null},
    parameters: {value: null},

    constructor: {
        value: function DocumentPart() {
            this.super();
        }
    },

    initWithTemplateAndFragment: {
        value: function (template, fragment) {
            this.template = template;
            this.fragment = fragment;
            this.objects = null;
            this.childComponents = [];
            this.parameters = null;
        }
    },

    startActingAsTopComponent: {
        value: function () {
            if (this.fragment) {
                defaultEventManager.registerEventHandlerForElement(
                    this, this.fragment);
            }
        }
    },

    stopActingAsTopComponent: {
        value: function () {
            if (this.fragment) {
                defaultEventManager.unregisterEventHandlerForElement(
                    this.fragment);
            }
        }
    },

    addChildComponent: {
        value: function (childComponent) {
            if (this.childComponents.indexOf(childComponent) == -1) {
                this.childComponents.push(childComponent);
            }
        }
    },

    removeChildComponent: {
        value: function (childComponent) {
            var childComponents = this.childComponents,
                ix = childComponents.indexOf(childComponent);

            if (ix > -1) {
                childComponents.splice(ix, 1);
                childComponent._parentComponent = null;
                childComponent._alternateParentComponent = null;
            }
        }
    },

    _addToDrawList: {
        value: Function.noop
    },

    _componentTreeLoadedDeferred: {value: null},
    loadComponentTree: {
        value: function () {
            var deferred = this._componentTreeLoadedDeferred,
                promises;

            if (!deferred) {
                deferred = Promise.defer();
                this._componentTreeLoadedDeferred = deferred;

                promises = [];

                this.childComponents.forEach(function (childComponent) {
                    promises.push(childComponent.loadComponentTree());
                });

                Promise.all(promises).then(function () {
                    deferred.resolve();
                }, deferred.reject).done();
            }

            return deferred.promise;
        }
    }
});

exports.DocumentPart = DocumentPart;

