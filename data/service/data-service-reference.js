var Montage = require("core/core").Montage,
    ModuleReference = require("core/module-reference").ModuleReference;

/**
 * @class DataServiceReference
 * @extends external:Montage
 */
exports.DataServiceReference = Montage.specialize(/** @lends DataServiceReference.prototype */ {

    

    initWithIdTypesAndRequire: {
        value: function (id, types, require) {
            if (!id || !require) {
                throw new Error("Module ID and require required");
            }
            this.module = new ModuleReference().initWithIdAndRequire(id, require);
            this.types = types;

            return this;
        }
    },

    /**
     * The identifier is the name of the service and is used to make the
     * serialization of models more readable.
     * @type {string}
     * @default this.name
     */
    identifier: {
        get: function () {
            return [
                "dataService",
                (this.serviceName || this.prototypeName || "unnamed").toLowerCase(),
                "reference"
            ].join("_");
        }
    },

    initWithModuleAndTypes: {
        value: function (serviceModule, types) {
            if (!serviceModule) {
                throw new Error("Module is required");
            }
            this.module = serviceModule;
            this.types = types;

            return this;
        }
    },


    deserializeSelf: {
        value: function (deserializer) {
            this.super(deserializer);
            var value;
            
            value = deserializer.getProperty("module");
            this.module = value;

            value = deserializer.getProperty("serviceName");
            this.serviceName = value;
            
            value = deserializer.getProperty("prototypeName");
            this.prototypeName = value;

            value = deserializer.getProperty("types") || [];
            this.types = value;
        }
    },

    serializeSelf: {
        value: function (serializer) {
            this.super(serializer);
        }
    },

    promise: {
        get: function () {
            var prototypeName;
            if (!this._promise) {
                prototypeName = this.prototypeName;
                this._promise = this.module ? this.module.exports.then(function (exports) {
                    var service = exports.montageObject;
                    if (!service && prototypeName) {
                        service = new exports[prototypeName]; 
                        //TODO Add Types To Service
                    }
                    return service;
                }) : Promise.resolve(null);
            }
            return this._promise;
        }
    },

    module: {
        value: undefined
    },

    moduleId: {
        get: function () {
            return this.module && this.module.id || undefined;
        }
    },

    prototypeName: {
        value: undefined
    },

    serviceName: {
        value: undefined
    },
    
    types: {
        value: undefined
    }

});