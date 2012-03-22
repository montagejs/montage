/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/core/serializer
 @requires montage
 @requires montage/core/uuid
 @requires montage/core/deserializer
 */
var Montage = require("montage").Montage;
var Uuid = require("core/uuid").Uuid;
var Deserializer = require("core/deserializer").Deserializer;
var logger = require("core/logger").logger("serializer");
var Element;

// Shadowing the global with a local allows us to feature-test without typeof
// Element does not exist on the server-side
if (typeof window !== "undefined") {
    Element = window.Element;
}

/**
 @class module:montage/core/serializer.Serializer
 @classdesc Serialized objects are indexed by uuid.
 @extends module:montage/core/core.Montage
 */
var Serializer = Montage.create(Montage, /** @lends module:montage/serializer.Serializer# */ {
    _MONTAGE_ID_ATTRIBUTE: {value: "data-montage-id"},
    _serializedObjects: {value: {}}, // label -> string
    _serializedReferences: {value: {}}, // uuid -> string
    _externalObjects: {value: null}, // label -> object
    _externalElements: {value: null},
    _objectStack: {value: null},
    _objectReferences: {value: null}, // uuid -> object with properies
    // last used index of an objectName to create a label
    _objectNamesIndex: {value: null},
    _objectLabels: {value: null}, // uuid -> label
    _serializationUnits: {value: []},
    _serializationUnitsIndex: {value: {}},

    serializeNullValues: {value: false},

    /**
     Defines a serialization unit for an object.
     @function
     @param {string} name The unit name.
     @param {function} funktion The delegate function that creates the serialization unit. This function accepts the object being serialized as an argument and should return an object to be be JSON'd.
     */
    defineSerializationUnit: {value: function(name, funktion) {
        this._serializationUnits.push(this._serializationUnitsIndex[name] = {
            name: name,
            funktion: funktion
        });
    }},

    /**
     Defines the require function to be used.
     @function
     @param {function} require The require function to be used to identify module ids of the objects being serialized.
     */
    initWithRequire: {
        value: function(require) {
            this._require = require;
            return this;
        }
    },

    /**
     Serializes a single object.
     @function
     @param {object} object The object to be serialized.
     @returns {string} The serialized object.
     */
    serializeObject: {
        value: function(object) {
            return this.serialize({root: object});
        }
    },

    /**
     Serialize several objects under specific labels.
     @function
     @param {object} objects A label->object mapping of the objects to be serialized.
     @returns {string} The serialized objects.
     */
    serialize: {
        value: function(objects) {
            var serialization,
                valueSerialization,
                label;

            this._serializedObjects = {};
            this._serializedReferences = {};
            this._externalObjects = {};
            this._externalElements = [];
            this._objectNamesIndex = {};
            this._objectLabels = {};
            this._objectReferences = {};

            for (label in objects) {
                this._objectLabels[objects[label].uuid] = label;
            }

            for (label in objects) {
                valueSerialization = this._serializeValue(objects[label], null, 2);
                // objects are automatically inserted as top level objects after calling _serializeValue, but native objects have to be manually inserted them.
                if (!(label in this._serializedObjects)) {
                    this._serializedObjects[label] = {value: valueSerialization};
                }
            }

            serialization = this._getSerialization(this._serializedObjects);
            //console.log(serialization);
            // save the require used for this serialization
            this._require = require;
            this._serialization = serialization;
            return serialization;
        }
    },

    /**
     This function is to be used in the context of serializeProperties delegate used for custom object serializations.
     It adds an entry to the "properties" serialization unit of the object being serialized.
     @function
     @param {string} name The name of the entry to be added.
     @param {string} value The value to be serialized.
     */
    set: {value: function(name, value, type) {
        var stack = this._objectStack,
            stackElement = stack[stack.length - 1],
            objectReferences, uuid;

        stackElement[name] = value;
        if (type === "reference") {
            uuid = stackElement.uuid;
            objectReferences = this._objectReferences;
            if (!(uuid in objectReferences)) {
                objectReferences[uuid] = {};
            }
            objectReferences[uuid][name] = true;
        }
    }},

    /**
     This function is to be used in the context of serializeProperties delegate used for custom object serializations.
     It serializes all properties specified as part of the "properties" serialization unit.
     @function
     @param {array} propertyNames The array with the property names to be serialized.
     */
    setAll: {value: function(propertyNames) {
        var ix = this._objectStack.length - 2,
            object = this._objectStack[ix];

        if (!propertyNames) {
            propertyNames = Montage.getSerializablePropertyNames(object);
        }

        for (var i = 0, l = propertyNames.length; i < l; i++) {
            var propertyName = propertyNames[i];
            this.set(propertyName, object[propertyName], Montage.getPropertyAttribute(object, propertyName, "serializable"));
        }
    }},

    setProperty: {
        value: function(name, value, type) {
            var stack = this._objectStack,
                stackElement = stack[stack.length - 1],
                objectReferences, uuid;

            stackElement.properties[name] = value;
            if (type === "reference") {
                objectReferences = this._objectReferences,
                uuid = stackElement.properties.uuid;
                if (!(uuid in objectReferences)) {
                    objectReferences[uuid] = {};
                }
                objectReferences[uuid][name] = true;
            }
        }
    },

    setProperties: {value: function(propertyNames) {
        var ix = this._objectStack.length - 2,
            object = this._objectStack[ix];

        if (!propertyNames) {
            propertyNames = Montage.getSerializablePropertyNames(object);
        }

        for (var i = 0, l = propertyNames.length; i < l; i++) {
            var propertyName = propertyNames[i];
            this.setProperty(propertyName, object[propertyName], Montage.getPropertyAttribute(object, propertyName, "serializable"));
        }
    }},

    setType: {
        value: function(type, value) {
            if (type === "object" || type === "prototype" || type === "value") {
                var stack = this._objectStack,
                stackElement = stack[stack.length - 1];

                delete stackElement.prototype;
                delete stackElement.object;
                delete stackElement.value;
                stackElement[type] = value;
            }
        }
    },

    setUnit: {
        value: function(name) {
            var stack = this._objectStack,
                stackElement = stack[stack.length - 1];

            if (stackElement._units.indexOf(name) === -1) {
                stackElement._units.push(this._serializationUnitsIndex[name]);
            }
        }
    },

    setAllUnits: {
        value: function() {
            var stack = this._objectStack,
                stackElement = stack[stack.length - 1];

            stackElement._units.length = 0;
            stackElement._units.push.apply(stackElement._units, this._serializationUnits);
        }
    },

    /**
     This function is to be used in the context of serializeProperties delegate used for custom object serializations.
     It adds an object to be serialized into the current serialization.
     @function
     @param {object} object The object to be serialized.
     */
    addObject: {value: function(object) {
        var valueSerialization = this._serializeValue(object, null, 2);
        var label = this._getObjectLabel(object);
        // objects are automatically inserted as top level objects after calling _serializeValue, but native objects have to be manually inserted them.
        if (!(label in this._serializedObjects)) {
            this._serializedObjects[label] = {value: valueSerialization};
        }
    }},

    addObjectReference: {
        value: function(object) {
            var label = this._getObjectLabel(object);

            if (!this._serializedObjects[label]) {
                this._externalObjects[label] = object;
            }
            return {"@": label};
        }
    },

    getObjectLabel: {
        value: function(object) {
            return this._getObjectLabel(object);
        }
    },

    /**
     @private
     */
    _pushContextObject: {value: function(object) {
        if (this._objectStack === null) {
            this._objectStack = [object];
        } else {
            this._objectStack.push(object);
        }
    }},

    /**
     @private
     */
    _popContextObject: {value: function() {
        return this._objectStack.pop();
    }},

    /**
     Returns a dictionary of the external objects that were referenced in the last serialization.
     @function
     @returns {object} The dictionary of external objects {label: object}
     */
    getExternalObjects: {value: function() {
        var externalObjects = this._externalObjects;

        for (var label in externalObjects) {
            var object = externalObjects[label];
            if (this._serializedObjects[label]) {
                delete externalObjects[label];
            }
        }

        return externalObjects;
    }},

    /**
     Returns a list of the external elements that were referenced in the last serialization.
     @function
     @returns {array} The array of external elements.
     */
    getExternalElements: {value: function() {
        return this._externalElements;
    }},

    /**
     @private
     */
    _getSerialization: {value: function(objects) {
        var objectsString = [],
            propsString,
            serialization = "",
            object;

        for (var key in objects) {
            object = objects[key];
            propsString = [];
            if ("prototype" in object) {
                propsString.push('"prototype":' + object.prototype);
                delete object.prototype;
            } else if ("object" in object) {
                propsString.push('"object":' + object.object);
                delete object.object;
            }
            for (var prop in object) {
                propsString.push('"' + prop + '":' + object[prop]);
            }
            objectsString.push('"' + key + '":{\n    ' + propsString.join(",\n    ") + '}');
        }

        if (objectsString.length > 0) {
            serialization = "{\n  " + objectsString.join(",\n\n  ") + "\n}";
        }

        return serialization;
    }},

    _getObjectLabel: {value: function(object) {
        var uuid = object.uuid,
            label = this._objectLabels[uuid];

        if (!label) {
            this._objectLabels[uuid] = label = this._generateLabelForObject(object);
        }

        return label;
    }},

    _generateLabelForObject: {value: function(object) {
        var objectName = object.identifier ||  Montage.getInfoForObject(object).objectName.toLowerCase(),
            index = this._objectNamesIndex[objectName];

        if (index) {
            this._objectNamesIndex[objectName] = index + 1;
            return objectName + index;
        } else {
            this._objectNamesIndex[objectName] = 2;
            return objectName;
        }
    }},

    _applySerializationUnits: {value: function(serializedUnits, object, units) {
        var value;

        if (!units) {
            units = this._serializationUnits;
        }

        for (var i = 0, unit; (unit = units[i]); i++) {
            value = unit.funktion(object, this);
            if (typeof value !== "undefined") {
                serializedUnits[unit.name] = this._serializeValue(value, null, 2);
            }
        }
    }},

    _isValueType: {
        value: function(object) {
            var typeOfObject = typeof object;

            return object instanceof RegExp || object instanceof Element || Array.isArray(object) || Object.getPrototypeOf(object) === Object.prototype || object.constructor === Function || !(typeOfObject === "object" || typeOfObject === "function");
        }
    },

    _applyTypeUnit: {
        value: function(serializedUnits, object) {
            if (this._isValueType(object)) {
                serializedUnits.value = this._serializeValue(object);
            } else {
                var objectInfo = Montage.getInfoForObject(object),
                    moduleId = this._require.identify(
                        objectInfo.moduleId,
                        objectInfo.require
                    ),
                    name = objectInfo.objectName;

                this._findObjectNameRegExp.test(moduleId);
                var defaultName = RegExp.$1.replace(this._toCamelCaseRegExp, this._replaceToCamelCase);

                if (defaultName === name) {
                    name = moduleId;
                } else {
                    name = moduleId + "[" + name + "]";
                }

                if (objectInfo.isInstance) {
                    serializedUnits.prototype = this._serializeValue(name);
                } else {
                    serializedUnits.object = this._serializeValue(name);
                }
            }
        }
    },

    /**
    @private
     */
    _findObjectNameRegExp: {
        value: /([^\/]+?)(\.reel)?$/
    },
    _toCamelCaseRegExp: {
        value: /(?:^|-)([^-])/g
    },
    _replaceToCamelCase: {
        value: function(_, g1) { return g1.toUpperCase() }
    },
    _serializeObject: {value: function(object, properties, type) {
        var uuid = object.uuid,
            serializedReference = this._serializedReferences[uuid],
            serializedUnits,
            propertyNames,
            objectInfo,
            label, moduleId, name, defaultName;

        if (serializedReference) {
            return serializedReference;
        }

        label = this._getObjectLabel(object);
        serializedReference = '{"@":"' + label + '"}';

        if (type === "reference") {
            if (!this._serializedObjects[label]) {
                this._externalObjects[label] = object;
            }
        } else {
            this._serializedReferences[uuid] = serializedReference;

            serializedUnits = {};
            objectInfo = Montage.getInfoForObject(object);

            moduleId = this._require.identify(
                objectInfo.moduleId,
                objectInfo.require
            );
            name = objectInfo.objectName;

            this._findObjectNameRegExp.test(moduleId);
            defaultName = RegExp.$1.replace(this._toCamelCaseRegExp, this._replaceToCamelCase);

            if (defaultName === name) {
                name = moduleId;
            } else {
                name = moduleId + "[" + name + "]";
            }

            if (objectInfo.isInstance) {
                serializedUnits.prototype = this._serializeValue(name);
            } else {
                serializedUnits.object = this._serializeValue(name);
            }

            if (typeof object.serializeProperties === "function") {
                this._pushContextObject(object);
                this._pushContextObject({});
                object.serializeProperties(this, Montage.getSerializablePropertyNames(object));
                serializedUnits.properties = this._serializeObjectLiteral(this._popContextObject(), null, 3);
                this._popContextObject();
            } else {
                // if no set of properties were passed then serialize all the
                // serializable properties of the object itself.
                if (!properties) {
                    properties = object;
                    propertyNames = Montage.getSerializablePropertyNames(object);
                    // HACK: only to be able to live together with serialization v1, remover after
                    var ix;
                    if ((ix = propertyNames.indexOf("_bindingDescriptors")) > -1) {
                        propertyNames.splice(ix, 1);
                    }
                    if ((ix = propertyNames.indexOf("_eventListenerDescriptors")) > -1) {
                        propertyNames.splice(ix, 1);
                    }
                    // end HACK
                }
                serializedUnits.properties = this._serializeObjectLiteral(properties, propertyNames, 3);
            }

            this._applySerializationUnits(serializedUnits, object);
            this._serializedObjects[label] = serializedUnits;
        }

        return serializedReference;
    }},

    /**
     @private
     */
    _serializeValue: {value: function(value, type, indent) {
        var indent = arguments[2] || 0,
            typeOfValue = typeof value;

            // typeof regexp will be "function" on WebKit because it's a callable
            // object.
            // http://www.mail-archive.com/es-discuss@mozilla.org/msg02824.html
            // https://bugs.webkit.org/show_bug.cgi?id=22082
            if (value instanceof RegExp) {
                return this._serializeRegExp(value);
            } else if (value != null && typeOfValue === "object" || typeOfValue === "function") {
                if (Element && value instanceof Element) {
                    return this._serializeElement(value);
                } else if (Array.isArray(value)) {
                    return this._serializeArray(value, indent + 1);
                } else if (Object.getPrototypeOf(value) === Object.prototype) {
                    return this._serializeObjectLiteral(value, null, indent + 1);
                } else if (value.constructor === Function) {
                    return this._serializeFunction(value, indent);
                } else {
                    // TODO: should refactor this to handle references here, doesn't make
                    //       sense to wait until it hits _serializeObject for that to happen
                    //       if we already have that information here, also, we need to
                    //       support references to values in the future, not just objects.
                    if (typeof value.serializeSelf === "function" && !(value.uuid in this._serializedReferences)) {
                        return this._customSerialization(value, indent + 1);
                    } else {
                        return this._serializeObject(value, null, type);
                    }
                }
            } else {
                return JSON.stringify(value);
            }
    }},

    _customSerialization: {
        value: function(object, indent) {
            this._pushContextObject(object);
            this._pushContextObject({properties: {}, _units: []});
            var newObject = object.serializeSelf(this);
            var objectDescriptor = this._popContextObject();
            this._popContextObject();

            if (typeof newObject === "undefined") {
                return this._serializeValueWithDescriptor(object, objectDescriptor, indent);
            } else {
                // make sure the new returned object is serialized under the same label
                this._objectLabels[newObject.uuid] = this._objectLabels[object.uuid]
                return this._serializeValue(newObject, indent);
            }
        }
    },

    /**
     @private
     */
    _serializeElement: {value: function(element) {
        var attribute = element.getAttribute(this._MONTAGE_ID_ATTRIBUTE),
            // TODO: element.id only here for backwards compatibility
            id = attribute || element.id;

        if (id) {
            this._externalElements.push(element);
            return '{"#":"' + id + '"}';
        } else {
            logger.error("Error: Not possible to serialize a DOM element with no id assigned: " + element.outerHTML);
        }
    }},

    /**
     @private
     */
    _serializeRegExp: {value: function(regexp) {
        return this._serializeValue({"/": {source: regexp.source, flags: (regexp.global ? "g" : "") + (regexp.ignoreCase ? "i" : "") + (regexp.multiline ? "m" : "")}});
    }},

    /**
     @private
     */
    _serializeObjectLiteral: {value: function(object, propertyNames) {
        propertyNames = propertyNames || Object.keys(object);

        var indent = arguments[2] || 0,
            propCount = propertyNames.length,
            serializedProperties = [],
            serializedReferenceProperties = this._objectReferences[object.uuid],
            i,
            key,
            value,
            serializationType;

        for (i = 0; i < propCount; i++) {
            key = propertyNames[i];
            value = object[key];

            if (typeof value !== "undefined" && (this.serializeNullValues || value !== null)) {
                serializationType = Montage.getPropertyAttribute(object, key, "serializable") || ((serializedReferenceProperties && serializedReferenceProperties.hasOwnProperty(key)) ? "reference" : "auto");
                serializedProperties.push(JSON.stringify(key) + ":" + this._serializeValue(value, serializationType, indent));
            }
        }

        var space = new Array(indent + 1).join("  ");
        return "{\n" + space + serializedProperties.join(",\n" + space) + "}";
    }},

    /**
     @private
     */
    _serializeArray: {value: function(array) {
        var indent = arguments[1] || 0;

        var serializedElements = [];
        for (var i = 0, j = array.length; i < j; i++) {
            serializedElements.push(this._serializeValue(array[i], null, indent));
        }
        var space = new Array(indent + 1).join("  ");
        return "[\n" + space + serializedElements.join(",\n" + space) + "]";
    }},

    _serializeFunctionRegexp: {
        enumerable: false,
        value: /^function[^(]*\(([^\)]+)\)\s*\{([\s\S]*)\}$/m
    },

    _serializeFunction: {value: function(funktion) {
        var indent = arguments[1] || 0,
            space = new Array(indent + 1).join("  "),
            string = funktion.toString(),
            parseString = this._serializeFunctionRegexp.exec(string);

        return this._serializeValue({"->": {arguments: parseString[1].split(/\s*,\s*/), body: parseString[2]}}, null, indent);
    }},

    _serializeValueWithDescriptor: {
        value: function(object, objectDescriptor, indent) {
            var label;

            if (!("prototype" in objectDescriptor || "object" in objectDescriptor || "value" in objectDescriptor)) {
                this._applyTypeUnit(objectDescriptor, object);
            }

            if ("value" in objectDescriptor) {
                return this._serializeValue(objectDescriptor.value);
            } else {
                objectDescriptor.properties = this._serializeObjectLiteral(objectDescriptor.properties, null, 3);
                if (units = /* assignment */ objectDescriptor._units) {
                    delete objectDescriptor._units;
                    this._applySerializationUnits(objectDescriptor, object, units);
                }
                label = this._getObjectLabel(object);
                this._serializedObjects[label] = objectDescriptor;
                return this._serializedReferences[object.uuid] = '{"@":"' + label + '"}';
            }
        }
    },
});


if (typeof exports !== "undefined") {
    exports.Serializer = Serializer;
}
