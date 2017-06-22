var Montage = require("../core").Montage,
    ObjectDescriptorReference = require("./object-descriptor-reference").ObjectDescriptorReference,
    deprecate = require("../deprecate"),
    logger = require("../logger").logger("objectDescriptor");

// TODO change Defaults[*] to Defaults.* throughout. Needless performance
// degradations.
var Defaults = {
    name: "default",
    cardinality: 1,
    mandatory: false,
    readOnly: false,
    denyDelete: false,
    valueType: "string",
    collectionValueType: "list",
    valueObjectPrototypeName: "",
    valueObjectModuleId: "",
    valueDescriptor: void 0,
    enumValues: [],
    defaultValue: void 0,
    helpKey: ""
};


/* TypeDescriptor */
/* DeleteRules */

/*
 Deny
 If there is at least one object at the relationship destination (employees), do not delete the source object (department).

 For example, if you want to remove a department, you must ensure that all the employees in that department are first transferred elsewhere (or fired!); otherwise, the department cannot be deleted.

 Nullify
 Remove the relationship between the objects but do not delete either object.

 This only makes sense if the department relationship for an employee is optional, or if you ensure that you set a new department for each of the employees before the next save operation.

 Cascade
 Delete the objects at the destination of the relationship when you delete the source.

 For example, if you delete a department, fire all the employees in that department at the same time.

 No Action
 Do nothing to the object at the destination of the relationship.

 Default
 Value that will be assigned ?

 */


/**
 * @class PropertyDescriptor
 */
exports.PropertyDescriptor = Montage.specialize( /** @lends PropertyDescriptor# */ {

    /**
     * Initialize a newly allocated property descriptor.
     * @function
     * @param {string} name name of the property descriptor to create
     * @param {ObjectDescriptor} objectDescriptor
     * @param {number} cardinality name of the property descriptor to create
     * @returns itself
     */
    initWithNameObjectDescriptorAndCardinality: {
        value:function (name, objectDescriptor, cardinality) {
            this._name = (name !== null ? name : Defaults["name"]);
            this._owner = objectDescriptor;
            this.cardinality = (cardinality > 0 ? cardinality : Defaults["cardinality"]);
            return this;
        }
    },

    /**
     * Initialize a newly allocated property descriptor.
     * @deprecated
     * @function
     * @param {string} name name of the property descriptor to create
     * @param {ObjectDescriptor} objectDescriptor
     * @param {number} cardinality name of the property descriptor to create
     * @returns itself
     */
    initWithNameBlueprintAndCardinality: {
        value: deprecate.deprecateMethod(void 0, function (name, blueprint, cardinality) {
            return this.initWithNameObjectDescriptorAndCardinality(name, blueprint, cardinality);
        }, "new PropertyBlueprint().initWithNameBlueprintAndCardinality", "new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality")
    },

    serializeSelf: {
        value:function (serializer) {
            serializer.setProperty("name", this.name);
            serializer.setProperty("objectDescriptor", this._owner, "reference");
            if (this.cardinality === Infinity) {
                serializer.setProperty("cardinality", -1);
            } else {
                this._setPropertyWithDefaults(serializer, "cardinality", this.cardinality);
            }
            this._setPropertyWithDefaults(serializer, "mandatory", this.mandatory);
            this._setPropertyWithDefaults(serializer, "readOnly", this.readOnly);
            this._setPropertyWithDefaults(serializer, "denyDelete", this.denyDelete);
            this._setPropertyWithDefaults(serializer, "valueType", this.valueType);
            this._setPropertyWithDefaults(serializer, "collectionValueType", this.collectionValueType);
            this._setPropertyWithDefaults(serializer, "valueObjectPrototypeName", this.valueObjectPrototypeName);
            this._setPropertyWithDefaults(serializer, "valueObjectModuleId", this.valueObjectModuleId);
            this._setPropertyWithDefaults(serializer, "valueDescriptor", this._valueDescriptorReference);
            if (this.enumValues.length > 0) {
                this._setPropertyWithDefaults(serializer, "enumValues", this.enumValues);
            }
            this._setPropertyWithDefaults(serializer, "defaultValue", this.defaultValue);
            this._setPropertyWithDefaults(serializer, "helpKey", this.helpKey);
            this._setPropertyWithDefaults(serializer, "definition", this.definition);

        }
    },

    deserializeSelf: {
        value:function (deserializer) {
            this._name = deserializer.getProperty("name");
            this._owner = deserializer.getProperty("objectDescriptor") || deserializer.getProperty("blueprint");
            this.cardinality = this._getPropertyWithDefaults(deserializer, "cardinality");
            if (this.cardinality === -1) {
                this.cardinality = Infinity;
            }
            this.mandatory = this._getPropertyWithDefaults(deserializer, "mandatory");
            this.readOnly = this._getPropertyWithDefaults(deserializer, "readOnly");
            this.denyDelete = this._getPropertyWithDefaults(deserializer, "denyDelete");
            this.valueType = this._getPropertyWithDefaults(deserializer, "valueType");
            this.collectionValueType = this._getPropertyWithDefaults(deserializer, "collectionValueType");
            this.valueObjectPrototypeName = this._getPropertyWithDefaults(deserializer, "valueObjectPrototypeName");
            this.valueObjectModuleId = this._getPropertyWithDefaults(deserializer, "valueObjectModuleId");
            this._valueDescriptorReference = this._getPropertyWithDefaults(deserializer, "valueDescriptor", "targetBlueprint");
            this.enumValues = this._getPropertyWithDefaults(deserializer, "enumValues");
            this.defaultValue = this._getPropertyWithDefaults(deserializer, "defaultValue");
            this.helpKey = this._getPropertyWithDefaults(deserializer, "helpKey");
            this.definition = this._getPropertyWithDefaults(deserializer, "definition");

        }
    },

    _setPropertyWithDefaults: {
        value:function (serializer, propertyName, value) {
            if (value != Defaults[propertyName]) {
                serializer.setProperty(propertyName, value);
            }
        }
    },

    _getPropertyWithDefaults: {
        value:function (deserializer) {
            var propertyNames = Array.prototype.slice.call(arguments).slice(1, Infinity),
                value, i, n;
            for (i = 0, n = propertyNames.length; i < n && !value; i += 1) {
                value = deserializer.getProperty(propertyNames[i]);
            }
            return value || Defaults[propertyNames[0]];
        }
    },

    _owner: {
        value:null
    },

    /**
     * Component description attached to this property descriptor.
     */
    owner: {
        get:function () {
            return this._owner;
        }
    },

    _name: {
        value:null
    },

    /**
     * Name of the object. The name is used to define the property on the
     * object.
     * @readonly
     * @type {string}
     */
    name: {
        serializable:false,
        get:function () {
            return this._name;
        }
    },

    /**
     * The identifier is the name of the descriptor, dot, the name of the
     * property descriptor, and is used to make the serialization of property
     * descriptors more readable.
     * @readonly
     * @type {string}
     */
    identifier: {
        get:function () {
            return [
                this.owner.identifier,
                this.name
            ].join("_");
        }
    },

    /**
     * Cardinality of the property descriptor.
     *
     * The Cardinality of an property descriptor is the number of values that
     * can be stored. A cardinality of one means that only one object can be
     * stored. Only positive values are legal. A value of infinity means that
     * any number of values can be stored.
     *
     * @type {number}
     * @default 1
     */
    cardinality: {
        value: Defaults["cardinality"]
    },

    /**
     * @type {boolean}
     * @default false
     */
    mandatory: {
        value: Defaults["mandatory"]
    },

    /**
     * @type {boolean}
     * @default false
     */
    denyDelete: {
        value: Defaults["denyDelete"]
    },

    /**
     * @type {boolean}
     * @default false
     */
    readOnly: {
        value: Defaults["readOnly"]
    },

    /**
     * Returns true if the cardinality is more than one.
     * @readonly
     * @type {boolean}
     * @default false
     */
    isToMany: {
        get:function () {
            return this.cardinality === Infinity || this.cardinality > 1;
        }
    },

    /**
     * @type {boolean}
     * @default false
     */
    isDerived: {
        get: function () {
            return false;
        }
    },

    /**
     * @type {string}
     * Definition can be used to express a property as the result of evaluating an expression
     * An example would be to flatten/traverse two properties across two objects to make its
     * content accessible as a new property name. For example, in a many to many relaational
     * style, a Movie would have a toDirector property to a "DirectorRole" which itself would
     * point through a toTalent property to the actual Person. A "director" property definition
     * would then be "toDirector.toTalent"
     *
     * TODO: It is likely that if a property has a definition, it should return true to isDerived
     * and false to serializable
     */
    definition: {
        value: null
    },

    /**
     * @type {string}
     * TODO: This is semantically similar to valueDescriptor
     * We should check if valueDescriptor can do the same job and eliminate
     * this.
     */
    valueType: {
        value: Defaults["valueType"]
    },

    /**
     * @type {string}
     */
    collectionValueType: {
        value: Defaults["collectionValueType"]
    },

    /**
     * @type {string}
     */
    valueObjectPrototypeName: {
        value: Defaults["valueObjectPrototypeName"]
    },

    /**
     * @type {string}
     */
    valueObjectModuleId: {
        value: Defaults["valueObjectModuleId"]
    },

    /**
     * Promise for the descriptor targeted by this association.
     *
     * **Note**: The setter expects an actual descriptor but the getter will
     * return a promise.
     * @type {string}
     */
    valueDescriptor: {
        serializable: false,
        get: function () {
            return this._valueDescriptorReference && this._valueDescriptorReference.promise(this.require);
        },
        set: function (descriptor) {

            this._valueDescriptorReference = new ObjectDescriptorReference().initWithValue(descriptor);
        }
    },

    _targetObjectDescriptorReference: {
        value: null
    },

    _enumValues: {
        value:null
    },

    /**
     * List of values for enumerated value types
     * @type {Array}
     */
    enumValues: {
        get:function () {
            if (!this._enumValues) {
                return [];
            }
            return this._enumValues;
        },
        set:function (value) {
            if (Array.isArray(value)) {
                this._enumValues = value;
            }
        }
    },

    defaultValue: {
        value: Defaults["defaultValue"]
    },

    helpKey:{
        value: Defaults["helpKey"]
    },

    objectDescriptorModuleId:require("../core")._objectDescriptorModuleIdDescriptor,
    objectDescriptor:require("../core")._objectDescriptorDescriptor,

    /**
     * @type {boolean}
     * possible values are: "reference" | "value" | "auto" | true | false,
     * @default false
     */
    serializable: {
        value: true
    },

    /********************************************************
     * Deprecated functions
     */

    /**
     * @deprecated
     * @readonly
     * @type {boolean}
     * @default false
     */
    // TODO: How to handle these case?
    isAssociationBlueprint: {
        get: deprecate.deprecateMethod(void 0, function () {
            return !!this._valueDescriptorReference;
        }, "isAssociationBlueprint", "No analog")
    },

    targetBlueprint: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this.valueDescriptor;
        }, "targetBlueprint.get", "valueDescriptor.get"),
        set: deprecate.deprecateMethod(void 0, function (value) {
            this.valueDescriptor = value;
        }, "targetBlueprint.get", "valueDescriptor.set")
    },

    blueprintDescriptorModuleId: require("../core")._objectDescriptorModuleIdDescriptor,
    blueprint: require("../core")._objectDescriptorDescriptor

});
