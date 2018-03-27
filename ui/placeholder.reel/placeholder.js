var Slot = require("../slot.reel").Slot;

var Placeholder = exports.Placeholder = Slot.specialize({

    constructor: {
        value: function () {
            if (!Placeholder.componentModulesMap) {
                Placeholder.componentModulesMap = new Map();
            }
        }
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
        value: false
    },

    _needsFetchingComponent: {
        value: false
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
                if (value) {
                    this._needsFetchingComponent = true;
                }

                this._componentModule = value;
                this.needsDraw = true;
            }
        }
    },

    _data: {
        value: null
    },

    data: {
        get: function () {
            return this._data;
        },
        set: function (data) {
            if (this._data !== data) {
                if (data) {
                    this._needsFetchingComponent = true;
                }

                this._data = data;
                this.needsDraw = true;
            }
        }
    },

    enterDocument: {
        value: function () {
            if (this.componentModule && !this.compoennt) {
                this._needsFetchingComponent = true;
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

    _fetchComponentIfNeeded: {
        value: function () {
            var self = this,
                promise, moduleId;

            if (this.componentModule &&
                (moduleId = this.componentModule.id) &&
                typeof moduleId === "string" && moduleId.length &&
                !this._fetchingComponentPromise && this._needsFetchingComponent
            ) {
                var require = this.componentModule.require;

                promise = this._fetchComponentConstructor(moduleId, require)
                    .then(function (componentConstructor) {
                        var component = (self.component = (
                                new componentConstructor()
                            )),
                            oldExitDocument = component.exitDocument;
                        
                        component.data = self.data;
                        component.exitDocument = function () {
                            if (oldExitDocument) {
                                oldExitDocument.call(component);
                                oldExitDocument = null;
                            }

                            component.cancelBindings();
                        };

                        self.content = component;
                    }, function (error) {
                        self._needsFetchingComponent = false;
                        throw error;
                    });
                
                this._fetchingComponentPromise = promise; 
            } else {
                promise = this._fetchingComponentPromise || Promise.resolve();
            }

            return promise.then(function () {
                self._needsFetchingComponent = false;
                self._fetchingComponentPromise = null;
            });
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
            this.element.classList.add('Placeholder');
            this._fetchComponentIfNeeded();
        }
    }

});
