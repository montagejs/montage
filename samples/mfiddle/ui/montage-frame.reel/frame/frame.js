var Template = require("montage/ui/template").Template,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    rootComponent = require("montage/ui/component").__root__;

window.Frame = {
    _MODULE_ID: "mfiddle",
    _javascript: document.querySelector('script[type="text/montage-javascript"]'),
    reset: function() {
        var childComponents = rootComponent.childComponents,
            childComponent;

        for (var i = 0; childComponent = childComponents[i]; i++) {
            childComponent.detachFromParentComponent();
            childComponent.cleanupDeletedComponentTree();
        }
        rootComponent.needsDraw = false;
    },

    boot: function() {
        var self = this,
            code = this._javascript.textContent.replace(/^\s*|\s*$/g, "");

        if (code) {
            this._defineModule(code, function(module) {
                var Owner = module.Owner;

                if (Owner) {
                    self.instantiateWithOwner(module.Owner.create());
                } else {
                    self.instantiateWithOwner(Component.create());
                }
            });
        } else {
            this.instantiateWithOwner(Component.create());
        }
    },

    instantiateWithOwner: function(owner) {
        // TODO: do I always need to do this?
        var template = Template.create().initWithDocument(window.document, window.require);

        // the template is built-in
        owner.hasTemplate = false;
        // ask template to fill templateObjects
        owner.templateObjects = {};

        template.instantiateWithOwnerAndDocument(owner, window.document, function(owner) {
            if (owner) {
                owner.needsDraw = true;
            } else {
                rootComponent.needsDraw = true;
            }
        });
    },

    // HACK: until this functionality is ready in require
    _defineModule: function(moduleCode, callback) {
        var self = this,
            dependencies = this._parseDependencies(moduleCode),
            factory = new Function("require", "exports", "module", moduleCode);

        Promise.all(dependencies.map(require.deepLoad)).then(function () {
            var exports = {};

            factory(require, exports, require.getModule(self._MODULE_ID));
            self._addMontageMetadata(exports);
            require.inject(self._MODULE_ID, exports);
            callback(require/*avoid being parsed*/(self._MODULE_ID));
        });
    },
    _addMontageMetadata: function(exports) {
        // mostly a copy paste of SerializationCompiler
        for (var name in exports) {
            var object = exports[name]
            if (!(object instanceof Object)) {
            // avoid attempting to reinitialize an aliased property
            } else if (object.hasOwnProperty("_montage_metadata") && !object._montage_metadata.isInstance) {
                object._montage_metadata.aliases.push(name);
                object._montage_metadata.objectName = name;
            } else if (!Object.isSealed(object)) {
                Object.defineProperty(exports[name], "_montage_metadata", {
                    value: {
                        require: require,
                        module: this._MODULE_ID,
                        moduleId: this._MODULE_ID,
                        property: name,
                        objectName: name,
                        aliases: [name],
                        isInstance: false
                    }
                });
            }
        }
    },
    _parseDependencies: function(moduleCode) {
        var o = {};
        moduleCode.replace(/(?:^|[^\w\$_.])require\s*\(\s*["']([^"']*)["']\s*\)/g, function(_, id) {
            o[id] = true;
        });
        return Object.keys(o);
    }
};

window.parent.postMessage("ready", "*");
