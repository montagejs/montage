var DataOperation = require("montage/data/service/data-operation").DataOperation,
    DataTrigger = require("montage/data/service/data-trigger").DataTrigger,
    DataService = require("montage/data/service/data-service").DataService,
    DataOperationType = require("montage/data/service/data-operation-type").DataOperationType,
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    deserialize = require("montage/core/serialization/deserializer/montage-deserializer").deserialize,
    Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
    serialize = require("montage/core/serialization/serializer/montage-serializer").serialize,
    Montage = require("montage").Montage,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    PropertyDescriptor = require("montage/core/meta/property-descriptor").PropertyDescriptor;



var ModelObject = Montage.specialize({

    children: {
        get: function () {
            if (!this._children) {
                this._children = [];
            }
            return this._children;
        },
        serializable: false
    },

    ancestors: {
        get: function () {
            if (!this._ancestors) {
                this._ancestors = [];
            }
            return this._ancestors;
        }
    }
});

var ModelDescriptor = new ObjectDescriptor().initWithName("ModelObject");
ModelDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("children", ModelDescriptor, 1));
ModelDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("ancestors", ModelDescriptor, 1));

describe("A DataTrigger", function() {
    
    it("can respect serializable property", function () {
        // Mimics DataService#_prototypeForType
        var prototype = Object.create(ModelObject.prototype),
            requisites = new Set("children", "ancestors"),
            service = new DataService(),
            cleanInstanceObjectCreate, cleanObjectCreatePropertyNames,
            cleanInstanceConstructor, cleanInstancePropertyNames,
            triggerInstance, triggerPropertyNames,
            propertyNames;
    
        DataTrigger.addTriggers(service, ModelDescriptor, prototype, requisites);

        triggerInstance = Object.create(prototype);
        cleanInstanceObjectCreate = Object.create(ModelObject.prototype),
        cleanInstanceConstructor = new ModelObject();

        triggerPropertyNames = Montage.getSerializablePropertyNames(triggerInstance);
        console.log("Triggered", propertyNames);

        cleanObjectCreatePropertyNames = Montage.getSerializablePropertyNames(cleanInstanceObjectCreate);        
        console.log("Object.create", propertyNames);

        cleanInstancePropertyNames = Montage.getSerializablePropertyNames(cleanInstanceConstructor);        
        console.log("Constructor", propertyNames);
        expect(triggerPropertyNames).toEqual(["children", "ancestors", "identifier"]);
        expect(triggerPropertyNames).toEqual(cleanObjectCreatePropertyNames);
        expect(cleanObjectCreatePropertyNames).toEqual(cleanInstancePropertyNames);
    });

});