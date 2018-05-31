var DataTrigger = require("montage/data/service/data-trigger").DataTrigger,
    DataService = require("montage/data/service/data-service").DataService,
    Montage = require("montage").Montage,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    PropertyDescriptor = require("montage/core/meta/property-descriptor").PropertyDescriptor;



var ModelObject = Montage.specialize({


    //Serializable (has get & set)
    ancestors: {
        get: function () {
            if (!this._ancestors) {
                this._ancestors = [];
            }
            return this._ancestors;
        },
        set: function (value) {
            this._ancestors = value;
        }
    },

    //NOT Serializable (serializable attribute is false)
    children: {
        get: function () {
            if (!this._children) {
                this._children = [];
            }
            return this._children;
        },
        set: function (value) {
            this._ancestors = value;
        },
        serializable: false
    },

    //Serializable
    siblings: {
        value: undefined
    },

    //NOT Serializable (not writable)
    cousins: {
        value: undefined,
        writable: false
    },

    //NOT Serializable (serializable attribute is false)
    friends: {
        value: undefined,
        serializable: false
    },

    

    //NOT Serializable (not writable)
    aunts: {
        get: function () {
            if (!this._aunts) {
                this._aunts = [];
            }
            return this._aunts;
        }
    },

    //NOT Serializable (not writable & serializable attribute is false)
    uncles: {
        get: function () {
            if (!this._uncles) {
                this._uncles = [];
            }
            return this._uncles;
        },
        serializable: false
    }
});

var ModelDescriptor = new ObjectDescriptor().initWithName("ModelObject");
ModelDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("ancestors", ModelDescriptor, Infinity));
ModelDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("children", ModelDescriptor, Infinity));

ModelDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("siblings", ModelDescriptor, Infinity));
ModelDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("cousins", ModelDescriptor, Infinity));
ModelDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("friends", ModelDescriptor, Infinity));

ModelDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("aunts", ModelDescriptor, Infinity));
ModelDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("uncles", ModelDescriptor, Infinity));

describe("A DataTrigger", function() {
    
    it("can respect serializable property", function () {
        // Mimics DataService#_prototypeForType
        var prototype = Object.create(ModelObject.prototype),
            requisites = new Set(),
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
        console.log("Triggered", triggerPropertyNames);

        cleanObjectCreatePropertyNames = Montage.getSerializablePropertyNames(cleanInstanceObjectCreate);        
        console.log("Object.create", cleanObjectCreatePropertyNames);

        cleanInstancePropertyNames = Montage.getSerializablePropertyNames(cleanInstanceConstructor);        
        console.log("Constructor", cleanInstancePropertyNames);

        expect(triggerPropertyNames).toEqual(["children", "ancestors", "identifier"]);
        expect(triggerPropertyNames).toEqual(cleanObjectCreatePropertyNames);
        expect(cleanObjectCreatePropertyNames).toEqual(cleanInstancePropertyNames);
    });

});