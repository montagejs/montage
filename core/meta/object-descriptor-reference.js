var Promise = require("../promise").Promise,
    ObjectDescriptorModule = require("./object-descriptor"),
    ModelModule = require("./model"),
    RemoteReference = require("./remote-reference").RemoteReference,
    ModelReference = require("./model-reference").ModelReference;

exports.ObjectDescriptorReference = RemoteReference.specialize( {

    constructor: {
        value: function ObjectDescriptorReference() {
            this.superForValue("constructor")();
        }
    },

    /**
     * The identifier is the name of the model and is used to make the
     * serialization of models more readable.
     * @type {string}
     * @default this.name
     */
    identifier: {
        get: function () {
            if (!this._reference) {
                this._reference = this.referenceFromValue(this._value);
            }
            return [
                "objectDescriptor",
                (this._reference.objectDescriptorName || this._reference.blueprintName || "unnamed").toLowerCase(),
                "reference"
            ].join("_");
        }
    },

    valueFromReference: {
        value: function (references) {

            // TODO: references.blueprintModule && references.binderReference are deprecated.
            var objectDescriptorModule = references.objectDescriptorModule || references.blueprintModule,
                modelReference = references.modelReference || references.binderReference,
                modelPromise = Promise.resolve(ModelModule.Model.group.defaultModel);
            if (modelReference) {
                modelPromise = ModelReference.prototype.valueFromReference(modelReference, require);
            }

            return modelPromise.then(function (model) {
                var ModuleObjectDescriptorModule;
                if (model) {
                    ModuleObjectDescriptorModule = require("./module-object-descriptor");
                    return ModuleObjectDescriptorModule.ModuleObjectDescriptor.getObjectDescriptorWithModuleId(objectDescriptorModule.id, objectDescriptorModule.require)
                        .then(function (objectDescriptor) {
                        if (objectDescriptor) {
                            model.addObjectDescriptor(objectDescriptor);
                            return objectDescriptor;
                        } else {
                            throw new Error("Error cannot find Object Descriptor " + objectDescriptorModule);
                        }
                    });
                } else {
                    return ObjectDescriptorModule.ObjectDescriptor.getObjectDescriptorWithModuleId(objectDescriptorModule, require);
                }
            });
        }
    },

    referenceFromValue: {
        value: function (value) {
            // the value is an object descriptor we need to serialize the object model and the object descriptor reference
            var references = {};
            references.objectDescriptorName = value.name;
            references.objectDescriptorModule = value.objectDescriptorInstanceModule;
            if (value.model && !value.model.isDefault) {
                references.modelReference = ModelReference.prototype.referenceFromValue(value.model);
            }
            return references;
        }
    }

});
