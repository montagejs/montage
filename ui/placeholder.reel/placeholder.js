var Slot = require("../slot.reel").Slot;

var Placeholder = exports.Placeholder = Slot.specialize({

    constructor: {
        value: function () {
            if (!Placeholder.componentModulesMap) {
                Placeholder.componentModulesMap = new Map();
            }
        }
    },

    _shouldFetchComponent: {
        value: false
    },

    _isLoadingComponent: {
        value: false
    },

    _componentsMap: {
        get: function () {
            return Placeholder.componentModulesMap;
        }
    },

    _component: {
        value: null
    },

    hasTemplate: {
        value: true
    },

    _componentModule: {
        value: null
    },

    componentModule: {
        get: function () {
            return this._componentModule;
        },
        set: function (value) {
            if (this._componentModule !== value) {
                this._componentModule = value;
                this._shouldFetchComponent = true;
                this.needsDraw = true;
            }
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
            if (this._context !== context) {
                this._context = context;
                this._shouldFetchComponent = true;
                this.needsDraw = true;
            }
        }
    },

    exitDocument: {
        value: function () {
            // Reset content to ensure that component is detached from component tree
            this.content = null;
            this.component = null;
        }
    },

    _dispatchPlaceholderContentLoaded: {
        value: function () {
            this.dispatchEventNamed(
                "placeholderContentLoaded",
                true,
                true,
                this
            );
        }
    },

    _fetchComponentIfNeeded: {
        value: function () {
            var promise;

            if (this.componentModule && this.context) {
                var moduleId = this.componentModule.id;

                if (typeof moduleId === "string" &&
                    moduleId.length &&
                    this._shouldFetchComponent
                ) {
                    var self = this,
                        require = this.componentModule.require;

                    this.content = null;
                    this._isLoadingComponent = true;
                    this._shouldFetchComponent = false;

                    promise = this._fetchComponentConstructor(moduleId, require)
                        .then(function (componentConstructor) {
                            var component = (self.component = (
                                    self.content = new componentConstructor()
                                )),
                                oldEnterDocument = component.enterDocument;
                            
                            component.enterDocument = function (isFirstTime) {
                                self._isLoadingComponent = false;
                                self._dispatchPlaceholderContentLoaded();

                                if ((component.enterDocument = oldEnterDocument)) {
                                    component.enterDocument(isFirstTime);
                                }
                            };
                    });
                }
            }

            return promise || Promise.resolve();
        }
    },

    _fetchComponentConstructor: {
        value: function (moduleId, require) {
            var promise;

            if (this._componentsMap.has(moduleId)) {
                promise = Promise.resolve(this._componentsMap.get(moduleId));
            } else {
                var self = this;

                promise = require.async(moduleId).then(function (exports) {
                    var componentConstructor = exports[Object.keys(exports)[0]];
                    self._componentsMap.set(moduleId, componentConstructor);

                    return componentConstructor;
                });
            }

            return promise;
        }
    },

    draw: {
        value: function () {
            var self = this;
                
            this._fetchComponentIfNeeded().then(function () {
                if (self.component) {
                    self.component.context = self.context;
                }
            });
        }
    }

});
