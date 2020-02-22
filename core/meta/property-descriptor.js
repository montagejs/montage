var Montage = require("../core").Montage,
    Promise = require("../promise").Promise,
    deprecate = require("../deprecate"),
    Enum = require("core/enum").Enum,
    logger = require("../logger").logger("objectDescriptor");

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

 No Action -> IGNORE
 Do nothing to the object at the destination of the relationship.

 Default
 Value that will be assigned ?

 */
exports.DeleteRule = DeleteRule = new Enum().initWithMembersAndValues(["NULLIFY","CASCADE","DENY","IGNORE"]);

// TODO: Replace Defaults by leveraging the value set on the prototype which really is the natural default
var Defaults = {
    name: "default",
    cardinality: 1,
    isMandatory: false,
    readOnly: false,
    denyDelete: false,
    deleteRule: DeleteRule.Nullify,
    inversePropertyName: void 0,
    valueType: "string",
    collectionValueType: "list",
    valueObjectPrototypeName: "",
    valueObjectModuleId: "",
    valueDescriptor: void 0,
    enumValues: [],
    defaultValue: void 0,
    helpKey: "",
    isLocalizable: false,
    isSearchable: false,
    isOrdered: false,
    isUnique: false,
    isSerializable: true,
    hasUniqueValues: false,
};


/*
TODO:

-   if a propertyDescriptor's serializable isn't false, it should be persisted,
    however propertyDescriptors with a definition expression, should not.

-   "valueType": "array" is not enough to persist a property in a modern relational DB,
    we need the type in the array
    Cardinality should be > 1, and also why isn't collectionValueType used as well?

-   Number types need more data in term of storage: signed or not, decimal / integer / precision / scale?
    Or is it a mapping issue?. Look at https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation

    Intl.NumberFormat:

-   Also, we need to model for a toMany, wether it's unique, and if it is ordered. In most classic
    to-many, order is irrelevant, but it sometimes can be.
    Unique and ordered makes only sense when cardinality is > 1, or not?
-   Unique can also means, like in a database, that the value of that property should be unique throughout a table.
    How do we express this as well, which would be helpful to know to set constraints appropriately.

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
            this._name = (name !== null ? name : Defaults.name);
            this._owner = objectDescriptor;
            this.cardinality = (cardinality > 0 ? cardinality : Defaults.cardinality);
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
        }, "new PropertyBlueprint().initWithNameBlueprintAndCardinality", "new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality", true)
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
            this._setPropertyWithDefaults(serializer, "isMandatory", this.isMandatory);
            this._setPropertyWithDefaults(serializer, "readOnly", this.readOnly);
            //Not needed anymore as it's now this.deleteRule === DeleteRule.DENY
            //and deserializing denyDelete will set the equivallent on value deleteRule
            // this._setPropertyWithDefaults(serializer, "denyDelete", this.denyDelete);
            this._setPropertyWithDefaults(serializer, "deleteRule", this.deleteRule);
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
            this._setPropertyWithDefaults(serializer, "inversePropertyName", this.inversePropertyName);
            this._setPropertyWithDefaults(serializer, "isLocalizable", this.isLocalizable);
            this._setPropertyWithDefaults(serializer, "isSerializable", this.isSerializable);
            this._setPropertyWithDefaults(serializer, "isSearchable", this.isSearchable);
            this._setPropertyWithDefaults(serializer, "isOrdered", this.isOrdered);
            this._setPropertyWithDefaults(serializer, "isUnique", this.isUnique);
            this._setPropertyWithDefaults(serializer, "hasUniqueValues", this.hasUniqueValues);
            this._setPropertyWithDefaults(serializer, "description", this.description);

        }
    },

    deserializeSelf: {
        value:function (deserializer) {
            var value;
            value = deserializer.getProperty("name");
            if (value !== void 0) {
                this._name = value;
            }
            value = deserializer.getProperty("objectDescriptor") || deserializer.getProperty("blueprint");
            if (value !== void 0) {
                this._owner = value;
            }

            this._overridePropertyWithDefaults(deserializer, "cardinality");

            if (this.cardinality === -1) {
                this.cardinality = Infinity;
            }

            this._overridePropertyWithDefaults(deserializer, "isMandatory", "mandatory");
            this._overridePropertyWithDefaults(deserializer, "readOnly");
            this._overridePropertyWithDefaults(deserializer, "denyDelete");
            this._overridePropertyWithDefaults(deserializer, "deleteRule");
            this._overridePropertyWithDefaults(deserializer, "valueType");
            this._overridePropertyWithDefaults(deserializer, "collectionValueType");
            this._overridePropertyWithDefaults(deserializer, "valueObjectPrototypeName");
            this._overridePropertyWithDefaults(deserializer, "valueObjectModuleId");
            this._overridePropertyWithDefaults(deserializer, "_valueDescriptorReference", "valueDescriptor", "targetBlueprint");
            this._overridePropertyWithDefaults(deserializer, "enumValues");
            this._overridePropertyWithDefaults(deserializer, "defaultValue");
            this._overridePropertyWithDefaults(deserializer, "helpKey");
            this._overridePropertyWithDefaults(deserializer, "definition");
            this._overridePropertyWithDefaults(deserializer, "inversePropertyName");
            this._overridePropertyWithDefaults(deserializer, "isLocalizable");
            this._overridePropertyWithDefaults(deserializer, "isSerializable");
            this._overridePropertyWithDefaults(deserializer, "isSearchable");
            this._overridePropertyWithDefaults(deserializer, "isOrdered");
            this._overridePropertyWithDefaults(deserializer, "isUnique");
            this._overridePropertyWithDefaults(deserializer, "hasUniqueValues");
            this._overridePropertyWithDefaults(deserializer, "description");
        }
    },

    _setPropertyWithDefaults: {
        value: function (serializer, propertyName, value) {
            if (value !== null && value !== Defaults[propertyName]) {
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

    /**
     * Applies a property from the deserializer to the object. If no such
     * property is defined on the deserializer, then the current value
     * of the property on this object will be used. If neither are available,
     * the default value will be used. The property assignment is done in-place,
     * so there is no return value.
     *
     * If no deserializerKeys are specified, the objectKey will be used instead.
     *
     * @private
     * @param {SelfDeserializer} deserializer
     * @param {String} objectKey The key of the property on this object
     * @param {String} deserializerKeys Rest parameters used as keys of the
     * property on the deserializer. Each key will be used sequentially until
     * a defined property value is found.
     */
    _overridePropertyWithDefaults: {
        value: function (deserializer, objectKey /*, deserializerKeys... */) {
            var propertyNames, value, i, n;

            if (arguments.length > 2) {
                propertyNames = Array.prototype.slice.call(arguments, 2, Infinity);

                for (i = 0, n = propertyNames.length; i < n && !value; i++) {
                    value = deserializer.getProperty(propertyNames[i]);
                }
            } else {
                value = deserializer.getProperty(objectKey);

            }

            this[objectKey] = value === undefined ? Defaults[propertyNames ? propertyNames[0] : objectKey] : value;
        }
    },

    _owner: {
        value: null
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
        value: null
    },

    /**
     * Name of the object. The name is used to define the property on the
     * object.
     * @readonly
     * @type {string}
     */
    name: {
        serializable:true,
        get:function () {
            return this._name;
        }
    },

    /**
     * Description of the property descriptor
     * object.
     * @readonly
     * @type {string}
     */
    description: {
        serializable:true,
        value: undefined
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
     * Right now with just one property forHandling Cardinality, we can't deal with something like
     * minCount and maxCount. minCount and maxCount with equal value would be similar to cardinality,
     * or we could make cardinality a Range as well.
     *
     *
     * @type {number}
     * @default 1
     */
    cardinality: {
        value: Defaults.cardinality
    },

    /**
     * @type {boolean}
     * @default false
     */
    isMandatory: {
        value: Defaults.isMandatory
    },

    /**
     * @type {boolean}
     * @default false
     */
    denyDelete: {
        get: function() {
            return this.deleteRule === DeleteRule.DENY;
        },
        set: function(value) {
            this.deleteRule = DeleteRule.DENY;
        }
    },

    /**
     * @type {boolean}
     * @default false
     */
    deleteRule: {
        value: Defaults.deleteRule
    },

    /**
     * @type {boolean}
     * @default false
     */
    readOnly: {
        value: Defaults.readOnly
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
     * Reflect if this property can be used to search with text and find that
     * objetc. It should be used by data storage to provide the ability to offer
     * such ability to find objects based on textual content of this property.
     *
     * Should it be limited to text/string type?
     *
     * @type {boolean}
     * @default false
     */
    isSearchable: {
         value: Defaults.readOnly
    },

    /**
     * models if the values of a collection / to-many property are ordered or not
     * This is relevant for example for relationships where a relational DB would
     * use a traditinal join table with 2 foreign keys to implement a many to many
     * if isOrdered is false, but if true, that join table should have an index,
     * or the relationship could be implemented with an array type in postgresql.
     *
     * If not ordered, a set could be used to hold data.
     *
     * @type {boolean}
     * @default false
     */
    isOrdered: {
        value: Defaults.isOrdered
   },

    /**
     * models if the value of the property is unique among all instances described
     * by the propertyDescriptor's owner.
     *
     * @type {boolean}
     * @default false
     */
    isUnique: {
        value: Defaults.isUnique
   },


    /**
     * models if the values of a collection / to-many property should be unique,
     * This is relevant for example for relationships where a relational DB would
     * use a traditinal join table with 2 foreign keys to implement a many to many,
     * in which naturally there could be only one association and therefore be unique
     * by nature. But a relationship implemented with an array type in postgresql for example,
     * would naturally offer the ability to hold multiple times the same value at
     * multiple indexes.
     *
     * @type {boolean}
     * @default false
     */
    hasUniqueValues: {
        value: Defaults.hasUniqueValues
   },


    /**
     * @type {string}
     * Definition can be used to express a property as the result of evaluating an expression
     * An example would be to flatten/traverse two properties across two objects to make its
     * content accessible as a new property name. For example, in a many to many relational
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
        value: Defaults.valueType
    },

    /**
     * @type {string}
     *
     * This property specifies the type of collectinon this property should use.
     * Default is an Array, but this could be a Set or other type of collection.
     */
    collectionValueType: {
        value: Defaults.collectionValueType
    },

    /**
     * @type {string}
     */
    valueObjectPrototypeName: {
        value: Defaults.valueObjectPrototypeName
    },

    /**
     * @type {string}
     */
    valueObjectModuleId: {
        value: Defaults.valueObjectModuleId
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
            // TODO: Needed for backwards compatibility with ObjectDescriptorReference.
            // Remove eventually, this can become completely sync
            if (this._valueDescriptorReference && typeof this._valueDescriptorReference.promise === "function") {
                deprecate.deprecationWarningOnce("valueDescriptor reference via ObjectDescriptorReference", "direct reference via object syntax");
                return this._valueDescriptorReference.promise(this.require);
            } else {
                return this._valueDescriptorReference && Promise.resolve(this._valueDescriptorReference);
            }
        },
        set: function (descriptor) {
            this._valueDescriptorReference = descriptor;
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
        value: Defaults.defaultValue
    },

    helpKey:{
        value: Defaults.helpKey
    },

    objectDescriptorModuleId:require("../core")._objectDescriptorModuleIdDescriptor,
    objectDescriptor:require("../core")._objectDescriptorDescriptor,

    /**
     * @type {boolean}
     * possible values are: "reference" | "value" | "auto" | true | false,
     * @default false
     */
    isSerializable: {
        value: Defaults.isSerializable
    },

    /**
     * @type {boolean}
     * Express the fact that the value of this property might change to meet the language,
     * cultural and other requirements of a specific target market (a locale).
     *
     * @default false
     */
    isLocalizable: {
        value: false
    },


    /**
     * Property name on the object on the opposite side of the relationship
     * to which the value of this property should be assigned.
     *
     * For example, take the following relationship:
     *
     * Foo.bars <------->> Bar.foo
     *
     * Each Bar object in Foo.bars will have Foo assigned to it's Bar.foo property. Therefore,
     * the inversePropertyName on the 'bars' propertyDescriptor would be 'foo'.
     */
    inversePropertyName: {
        value: undefined
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
        }, "isAssociationBlueprint", "No analog", true)
    },

    targetBlueprint: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this.valueDescriptor;
        }, "targetBlueprint.get", "valueDescriptor.get", true),
        set: deprecate.deprecateMethod(void 0, function (value) {
            this.valueDescriptor = value;
        }, "targetBlueprint.get", "valueDescriptor.set", true)
    },

    blueprintDescriptorModuleId: require("../core")._objectDescriptorModuleIdDescriptor,
    blueprint: require("../core")._objectDescriptorDescriptor,




});
