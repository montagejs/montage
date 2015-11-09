var Montage = require("../../core").Montage;
var MontageSerializerModule = require("./montage-serializer");
var PropertiesSerializer = require("./properties-serializer").PropertiesSerializer;
var SelfSerializer = require("./self-serializer").SelfSerializer;
var UnitSerializer = require("./unit-serializer").UnitSerializer;
var Alias = require("../alias").Alias;

var MontageVisitor = Montage.specialize({
    _MONTAGE_ID_ATTRIBUTE: {value: "data-montage-id"},
    _require: {value: null},
    _units: {value: null},
    _elements: {value: null},
    builder: {value: null},
    labeler: {value: null},
    _objectsSerialization: {value: null},

    constructor: {
        value: function MontageVisitor() {}
    },

    initWithBuilderAndLabelerAndRequireAndUnits: {
        value: function (builder, labeler, require, units) {
            this.builder = builder;
            this.labeler = labeler;
            this._objectsSerialization = Object.create(null);
            this._require = require;
            this._units = units;
            this._elements = [];

            return this;
        }
    },

    getTypeOf: {
        value: function (object) {
            // Module and Alias are MontageObject's too so they need to be
            // tested for before.
            if (object.isModuleReference) {
                return "Module";
            } else if (object instanceof Alias) {
                return "Alias";
            } else if ("getInfoForObject" in object || "getInfoForObject" in object.constructor) {
                return "MontageObject";
            } else if (object.thisIsAReferenceCreatedByMontageSerializer) {
                return "MontageReference";
            } else if (typeof Element !== "undefined" && Element.isElement(object)) {
                return "Element";
            }
        }
    },

    visitMontageReference: {
        value: function (malker, object, name) {
            this.builder.top.setProperty(name, object.reference);
        }
    },

    visitElement: {
        value: function (malker, element, name) {
            var elementReference,
                id;

            id = element.getAttribute(this._MONTAGE_ID_ATTRIBUTE);

            if (id) {
                elementReference = this.builder.createElementReference(id);
                this.storeValue(elementReference, element, name);
                this._elements.push(element);
            } else {
                throw new Error("Not possible to serialize a DOM element with no " + this._MONTAGE_ID_ATTRIBUTE + " assigned: " + element.outerHTML);
            }
        }
    },

    visitModule: {
        value: function (malker, reference, name) {
            var referenceReference,
                moduleId;

            try {
                moduleId = reference.resolve(this._require);
            } catch (e) {
                throw new Error("Not possible to serialize module reference " +
                    reference.id + " from package " + reference.require.location +
                    " inside package " + this._require.location
                );
            }

            referenceReference = this.builder.createModuleReference(moduleId);
            this.storeValue(referenceReference, reference, name);
        }
    },

    visitAlias: {
        value: function (malker, object) {
            var label = this.labeler.getTemplatePropertyLabel(object);

            var builderObject = this.builder.createCustomObject();

            builderObject.setProperty("alias", object.value);
            this.builder.top.setProperty(label, builderObject);
        }
    },

    visitMontageObject: {
        value: function (malker, object, name) {
            if (this.isObjectSerialized(object)) {
                this.serializeReferenceToMontageObject(malker, object, name);
            } else {
                this.handleMontageObject(malker, object, name);
            }
        }
    },

    handleMontageObject: {
        value: function (malker, object, name) {
            var builderObject = this.builder.createCustomObject(),
                substituteObject;

            this.setObjectSerialization(object, builderObject);

            substituteObject = this.serializeMontageObject(malker, object, builderObject);

            if (substituteObject) {
                this.serializeSubstituteObject(malker, object, name, builderObject, substituteObject);
            } else {
                builderObject.setLabel(this.labeler.getObjectLabel(object));
                this.builder.top.setProperty(name, builderObject);
            }
        }
    },

    serializeReferenceToMontageObject: {
        value: function (malker, object, name) {
            var label = this.labeler.getObjectLabel(object),
                reference = this.builder.createObjectReference(label);

            this.builder.top.setProperty(name, reference);
        }
    },

    serializeSubstituteObject: {
        value: function (malker, object, name, builderObject, substituteObject) {
            var label,
                oldLabel,
                newLabel,
                substituteBuilderObject;

            label = this.labeler.getObjectLabel(object);

            // There are two label strategies to choose from when an object
            // is substituted for another one in a serialization:
            //
            // 1) The object that was substituted now starts being recognized
            //    with the label of the substituted object, this means
            //    relabeling all previously created references.
            //
            // 2) In the case that the object being substituted has a user
            //    defined label then we want to honor this label and relabel
            //    the substitute object with the user defined label instead.
            if (this.labeler.isUserDefinedLabel(label)) {
                oldLabel = this.labeler.getObjectLabel(substituteObject);

                // Make sure that the substitute object is now
                // known by the user defined label instead.
                this.labeler.setObjectLabel(substituteObject, label);

                // If there were references made to the substitute object we
                // need to change them to start pointing to the user defined
                // label.
                this.builder.relabelReferences(oldLabel, label);

                // Check if the substitute object was already serialized, if it
                // was we need to change the label of the serialization.
                substituteBuilderObject = this.getObjectSerialization(substituteObject);
                if (substituteBuilderObject) {
                    substituteBuilderObject.setLabel(label);

                    // If the substitute object also has a user defined label
                    // then we create a reference from one label to the other
                    if (this.labeler.isUserDefinedLabel(oldLabel)) {
                        this.builder.createObjectReference(label).setLabel(oldLabel);
                    }
                }

                malker.visit(substituteObject, name);
            } else {
                malker.visit(substituteObject, name);

                newLabel = this.labeler.getObjectLabel(substituteObject);

                // Make sure that the substituted object is now known by the
                // label of the substitute object.
                this.labeler.setObjectLabel(object, newLabel);

                // If there were references made to object we need to change
                // them to start pointing to the substitute object.
                this.builder.relabelReferences(label, newLabel);
            }
        }
    },

    serializeMontageObject: {
        value: function (malker, object, builderObject) {
            var selfSerializer,
                substituteObject,
                propertiesBuilderObject = this.builder.createObjectLiteral();

            this.setObjectType(object, builderObject);
            builderObject.setProperty("properties", propertiesBuilderObject);

            this.builder.push(builderObject);

            if (typeof object.serializeSelf === "function") {
                selfSerializer = new SelfSerializer().
                    initWithMalkerAndVisitorAndObject(
                        malker, this, object, builderObject);
                substituteObject = object.serializeSelf(selfSerializer);
            } else {
                this.setObjectProperties(malker, object);
                this.setObjectCustomUnits(malker, object);
            }

            this.builder.pop();

            // Remove the properties unit in case none was serialized,
            // we need to add it before any other units to make sure that
            // it's the first unit to show up in the serialization, since we
            // don't have a way to order the property names in a serialization.
            if (propertiesBuilderObject.getPropertyNames().length === 0) {
                builderObject.clearProperty("properties");
            }

            return substituteObject;
        }
    },

    setObjectType: {
        value: function (object, builderObject) {
            var isInstance = Montage.getInfoForObject(object).isInstance,
                locationId = this.getObjectLocationId(object),
                locationIdBuilderObject = this.builder.createString(locationId);

            if (isInstance) {
                builderObject.setProperty("prototype", locationIdBuilderObject);
            } else {
                builderObject.setProperty("object", locationIdBuilderObject);
            }
        }
    },

    getObjectModuleId: {
        value: function (object) {
            var objectInfo = Montage.getInfoForObject(object);

            return this._require.identify(objectInfo.moduleId,
                                          objectInfo.require);
        }
    },

    getObjectLocationId: {
        value: function (object) {
            var moduleId = this.getObjectModuleId(object),
                defaultObjectName,
                objectInfo = Montage.getInfoForObject(object),
                objectName = objectInfo.objectName;

            defaultObjectName = MontageSerializerModule.MontageSerializer.getDefaultObjectNameForModuleId(moduleId);

            if (defaultObjectName === objectName) {
                return moduleId;
            } else {
                return moduleId + "[" + objectName + "]";
            }
        }
    },

    /*
     * Expected object at the top of the stack: CustomObject
     */
    setObjectProperties: {
        value: function (malker, object) {
            var propertiesSerializer,
                propertiesObject;

            propertiesObject = this.builder.top.getProperty("properties");
            this.builder.push(propertiesObject);

            if (typeof object.serializeProperties === "function") {
                propertiesSerializer = new PropertiesSerializer()
                    .initWithMalkerAndVisitorAndObject(malker, this, object);
                object.serializeProperties(propertiesSerializer);
            } else {
                this.setSerializableObjectProperties(malker, object);
            }

            this.builder.pop();
        }
    },

    /*
     * Expected object at the top of the stack: ObjectLiteral
     */
    setSerializableObjectProperties: {
        value: function (malker, object) {
            var type,
                propertyName,
                propertyNames = Montage.getSerializablePropertyNames(object),
                propertyNamesCount = propertyNames.length;

            for (var i = 0; i < propertyNamesCount; i++) {
                propertyName = propertyNames[i];
                type = Montage.getPropertyAttribute(object, propertyName, "serializable");
                this.setProperty(malker, propertyName, object[propertyName], type);
            }
        }
    },

    hackIsReferenceAllowedForValue: {
        value: function (value) {
            // Only serialize as a reference values that are non-null objects,
            // we don't support references to non-objects and elements.
            // There's nothing in the serialization that prevents us to store
            // a reference to an object but that would be an external reference
            // the problem here is that the serializable defaults to "reference"
            // for most cases when in reality we probably just want "value".
            return typeof value === "object" &&
                   value != null &&
                   !(typeof Element !== "undefined" &&
                     Element.isElement(value));
        }
    },

    /*
     * Expected object at the top of the stack: ObjectLiteral
     */
    setProperty: {
        value: function (malker, propertyName, value, type) {
            var label;

            if (type === "reference" && this.hackIsReferenceAllowedForValue(value)) {
                label = this.labeler.getObjectLabel(value);
                var reference = this.builder.createObjectReference(label);
                this.builder.top.setProperty(propertyName, reference);
            } else {
                malker.visit(value, propertyName);
            }
        }
    },

    setObjectCustomUnits: {
        value: function (malker, object) {
            for (var unitName in this._units) {
                this.setObjectCustomUnit(malker, object, unitName);
            }
        }
    },

    setObjectCustomUnit: {
        value: function (malker, object, unitName) {
            var unit = this._units[unitName],
                value,
                unitSerializer;

            if (!unit) {
                return;
            }

            unitSerializer = new UnitSerializer()
                .initWithMalkerAndVisitorAndObject(malker, this, object);

            value = unit(unitSerializer, object);
            if (value != null) {
                malker.visit(value, unitName);
            }
        }
    },

    getExternalObjects: {
        value: function () {
            var externalObjects = {},
                labels = this.builder.getExternalReferences(),
                label;

            for (var i = 0; label = labels[i]; i++) {
                externalObjects[label] = this.labeler.getObjectByLabel(label);
            }

            return externalObjects;
        }
    },

    getExternalElements: {
        value: function () {
            return this._elements;
        }
    },

    getCustomObjectTypeOf: {
        value: function() {},
        writable: true
    },

    isCustomObject: {
        value: function(object) {
            var type = this.getCustomObjectTypeOf(object);

            return typeof type === "string";
        }
    },

    setObjectSerialization: {
        value: function(object, serialization) {
            this._objectsSerialization[Object.hash(object)] = serialization;
        }
    },

    getObjectSerialization: {
        value: function(object) {
            return this._objectsSerialization[Object.hash(object)];
        }
    },

    isObjectSerialized: {
        value: function(object) {
            return Object.hash(object) in this._objectsSerialization;
        }
    },

    enterObject: {
        value: function(malker, object, name) {
            var builderObject = this.builder.createObjectLiteral();

            this.setObjectSerialization(object, builderObject);
            this.builder.push(builderObject);
        }
    },

    exitObject: {
        value: function(malker, object, name) {
            this.storeValue(this.builder.pop(), object, name);
        }
    },

    visitObject: {
        value: function(malker, object, name) {
            var label = this.labeler.getObjectLabel(object),
                reference = this.builder.createObjectReference(label);

            // visitObject is only called after the object has been entered
            // and serialized, if we're visiting it then label the serialization
            // because we need to create a reference to it now.
            this.getObjectSerialization(object).setLabel(label);
            this.builder.top.setProperty(name, reference);
        }
    },

    enterArray: {
        value: function(malker, array, name) {
            var builderObject = this.builder.createArray();

            this.setObjectSerialization(array, builderObject);
            this.builder.push(builderObject);
        }
    },

    exitArray: {
        value: function(malker, array, name) {
            this.storeValue(this.builder.pop(), array, name);
        }
    },

    visitArray: {
        value: function(malker, array, name) {
            var label = this.labeler.getObjectLabel(array),
                reference = this.builder.createObjectReference(label);

            // visitArray is only called after the array has been entered
            // and serialized, if we're visiting it then label the serialization
            // because we need to create a reference to it now.
            this.getObjectSerialization(array).setLabel(label);
            this.builder.top.setProperty(name, reference);
        }
    },

    visitRegExp: {
        value: function(malker, regexp, name) {
            this.storeValue(this.builder.createRegExp(regexp), regexp, name);
        }
    },

    visitString: {
        value: function(malker, string, name) {
            this.storeValue(this.builder.createString(string), string, name);
        }
    },

    visitNumber: {
        value: function(malker, number, name) {
            this.storeValue(this.builder.createNumber(number), number, name);
        }
    },

    visitBoolean: {
        value: function(malker, boolean, name) {
            this.storeValue(this.builder.createBoolean(boolean), boolean, name);
        }
    },

    visitNull: {
        value: function(malker, name) {
            this.storeValue(this.builder.createNull(), null, name);
        }
    },

    visitCustomObject: {
        value: function(malker, object, name) {
            var type = this.getCustomObjectTypeOf(object),
                method = MontageVisitor.customObjectVisitors["visit" + type];

            if (type) {
                return method.call(global, malker, this, object, name);
            } else {
                throw new Error("Object's type is unknown: " + object);
            }
        }
    },

    storeValue: {
        value: function(value, object, name) {
            // if the object has no name then give it a label otherwise it
            // won't be part of the serialization
            if (typeof name === "undefined") {
                value.setLabel(this.labeler.getObjectLabel(object));
            } else {
                this.builder.top.setProperty(name, value);
            }
        }
    }

}, {
    customObjectVisitors: {value: Object.create(null)},

    makeGetCustomObjectTypeOf: {
        value: function makeGetCustomObjectTypeOf(getCustomObjectTypeOf) {
            var previousGetCustomObjectTypeOf = this.prototype.getCustomObjectTypeOf;

            return function(value) {
                return getCustomObjectTypeOf(value) ||
                    previousGetCustomObjectTypeOf(value);
            }
        }
    },

    addCustomObjectVisitor: {
        value: function(visitor) {
            var customObjectVisitors = this.customObjectVisitors;

            for (var methodName in visitor) {
                if (methodName === "getTypeOf") {
                    continue;
                }

                if (typeof visitor[methodName] === "function"
                    && /^visit/.test(methodName)) {
                    if (typeof customObjectVisitors[methodName] === "undefined") {
                        customObjectVisitors[methodName] = visitor[methodName].bind(visitor);
                    } else {
                        return new Error("Visitor '" + methodName + "' is already registered.");
                    }
                }
            }

            this.prototype.getCustomObjectTypeOf = this.makeGetCustomObjectTypeOf(visitor.getTypeOf);
        }
    },

    resetCustomObjectVisitors: {
        value: function() {
            this.customObjectVisitors = Object.create(null);
            this.prototype.getCustomObjectTypeOf = function() {};
        }
    }
});

exports.MontageVisitor = MontageVisitor;
