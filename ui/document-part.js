var Montage = require("montage").Montage,
    logger = require("core/logger").logger("document-part"),
    Promise = require("q"),
    defaultEventManager = require("core/event/event-manager").defaultEventManager;

var DocumentPart = Montage.create(Montage, {
    template: {value: null},
    fragment: {value: null},
    objects: {value: null},
    childComponents: {value: null},

    initWithTemplateAndFragment: {
        value: function(template, fragment) {
            this.template = template;
            this.fragment = fragment;
            this.objects = null;
            this.childComponents = [];

            if (fragment) {
                defaultEventManager.registerEventHandlerForElement(this, fragment);
            }
        }
    },

    _addChildComponent: {
        value: function(childComponent) {
            this.childComponents.push(childComponent);
        }
    },

    _componentTreeLoadedDeferred: {value: null},
    loadComponentTree: {
        value: function() {
            var deferred = this._componentTreeLoadedDeferred,
                promises;

            if (!deferred) {
                deferred = Promise.defer();;
                this._componentTreeLoadedDeferred = deferred;

                promises = [];

                this.childComponents.forEach(function(childComponent) {
                    promises.push(childComponent.loadComponentTree());
                });

                Promise.all(promises).then(function() {
                    deferred.resolve();
                }, deferred.reject);
            }

            return deferred.promise;
        }
    }
});

exports.DocumentPart = DocumentPart;
