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
        value: true
    },

    needsFetchingComponent: {
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
                this._componentModule = value;
                this.needsFetchingComponent = true;
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
                this._data = data;
                this.needsFetchingComponent = true;
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
            var promise, moduleId;

            if (this.componentModule &&
                (moduleId = this.componentModule.id) &&
                typeof moduleId === "string" && moduleId.length &&
                this.needsFetchingComponent
            ) {
                var self = this,
                    require = this.componentModule.require;

                this.content = null;

                promise = this._fetchComponentConstructor(moduleId, require)
                    .then(function (componentConstructor) {
                        var component = (self.component = (
                            new componentConstructor()
                        ));
                        component.data = self.data;
                        self.needsFetchingComponent = false;
                        self.content = component;
                });
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
            this._fetchComponentIfNeeded();
        }
    }

});
