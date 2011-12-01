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

/**
 @class module:montage/core/serializer.Serializer
 @classdesc Serialized objects are indexed by uuid.
 @extends module:montage/core/core.Montage
 */
var Serializer = Montage.create(Montage, /** @lends module:montage/serializer.Serializer# */ {
    _serializedObjects: {value: {}}, // uuid -> string
    _serializedReferences: {value: {}}, // uuid -> string
    _externalObjects: {value: null}, // label -> object
    _externalElements: {value: null},
    _objectStack: {value: null},
    _objectReferences: {value: null}, // uuid -> object with properies
    // last used index of an objectName to create a label
    _objectNamesIndex: {value: null},
    _objectLabels: {value: null}, // uuid -> label
    _serializationUnits: {value: []},

    serializeNullValues: {value: false},

    /**
     Defines a serialization unit for an object.
     @function
     @param {string} name The unit name.
     @param {function} funktion The delegate function that creates the serialization unit. This function accepts the object being serialized as an argument and should return an object to be be JSON'd.
     */
    defineSerializationUnit: {value: function(name, funktion) {
        this._serializationUnits.push({
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
     <i>This function is to be used in the context of serializeSelf delegate used for custom object serializations.</i>
     It adds an entry to the "properties" serialization unit of the object being serialized.
     @function
     @param {string} name The name of the entry to be added.
     @param {string} value The value to be serialized.
     */
    set: {value: function(name, value) {
        var stack = this._objectStack;

        return (stack[stack.length - 1][name] = value);
    }},

    /**
     <i>This function is to be used in the context of serializeSelf delegate used for custom object serializations.</i>
     It adds an entry to the "properties" serialization unit of the object being serialized. The value for this entry will be stored as a reference only and not the value itself.
     @function
     @param {string} name The name of the entry to be added.
     @param {string} value The value to be referenced.
     */
    setReference: {value: function(name, value) {
        var stack = this._objectStack,
            stackElement = stack[stack.length - 1],
            objectReferences = this._objectReferences,
            uuid = stackElement.uuid;

        if (!(uuid in objectReferences)) {
            objectReferences[uuid] = {};
            objectReferences[uuid][name] = true;
        }

        return (stackElement[name] = value);
    }},

    /**
     <i>This function is to be used in the context of serializeSelf delegate used for custom object serializations.</i>
     It serializes all properties specified as part of the "properties" serialization unit.
     @function
     @param {array} propertyNames The array with the property names to be serialized.
     */
    setProperties: {value: function(propertyNames) {
        var ix = this._objectStack.length - 2,
            object = this._objectStack[ix];

        for (var i = 0, l = propertyNames.length; i < l; i++) {
            var propertyName = propertyNames[i];
            // TODO: remove this later when old serialization is gone
            if (propertyName === "_bindingDescriptors" || propertyName === "_eventListenerDescriptors") {
                continue;
            }
            if (Montage.getPropertyAttribute(object, propertyName, "serializable") === "reference") {
                this.setReference(propertyName, object[propertyName]);
            } else {
                this.set(propertyName, object[propertyName]);
            }
        }
    }},

    /**
     <i>This function is to be used in the context of serializeSelf delegate used for custom object serializations.</i>
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
            if (this._serializedObjects[object.uuid]) {
                delete externalObjects[label];
            }
        }

        return externalObjects;
    }},

    /**
     Returns a list of the external elements that were referenced in the last serialization.
     @function
     @returns {array} The arrat of external elements.
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
        var objectName = Montage.getInfoForObject(object).objectName.toLowerCase(),
            index = this._objectNamesIndex[objectName] || 1;

        this._objectNamesIndex[objectName] = index + 1;
        return objectName + index;
    }},

    _applySerializationUnits: {value: function(serializedUnits, object) {
        var units = this._serializationUnits,
            value;

        for (var i = 0, unit; (unit = units[i]); i++) {
            value = unit.funktion(object);
            if (typeof value !== "undefined") {
                serializedUnits[unit.name] = this._serializeValue(value, null, 2);
            }
        }
    }},

    /**
    @private
     */
    _serializeObject: {value: function(object, properties, type) {
        var uuid = object.uuid,
            serializedReference = this._serializedReferences[uuid],
            serializedUnits,
            propertyNames,
            objectInfo,
            label;

        if (serializedReference) {
            return serializedReference;
        }

        label = this._getObjectLabel(object);
        serializedReference = '{"@":"' + label + '"}';

        if (type === "reference") {
            if (!this._serializedObjects[object.uuid]) {
                this._externalObjects[label] = object;
            }
        } else {
            this._serializedReferences[uuid] = serializedReference;

            serializedUnits = {};
            objectInfo = Montage.getInfoForObject(object);

            serializedUnits.module = this._serializeValue(this._require.identify(
                objectInfo.moduleId,
                objectInfo.require)
            );
            serializedUnits.name = this._serializeValue(objectInfo.objectName);

            if (typeof object.serializeSelf === "function") {
                this._pushContextObject(object);
                this._pushContextObject({});
                object.serializeSelf(this, Montage.getSerializablePropertyNames(object));
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
    _serializeValue: {value: function(value, type) {
        var indent = arguments[2] || 0;
        // typeof regexp will be "function" on WebKit because it's a callable
        // object.
        // http://www.mail-archive.com/es-discuss@mozilla.org/msg02824.html
        // https://bugs.webkit.org/show_bug.cgi?id=22082
        if (value instanceof RegExp) {
            return this._serializeRegExp(value);
        } else if (value && (typeof value === "object" || typeof value === "function")) {
            if (value instanceof Element) {
                return this._serializeElement(value);
            } else if (Array.isArray(value)) {
                return this._serializeArray(value, indent + 1);
            } else if (Object.getPrototypeOf(value) === Object.prototype) {
                return this._serializeObjectLiteral(value, null, indent + 1);
            } else if (value.constructor === Function) {
                return this._serializeFunction(value, indent);
            } else {
                return this._serializeObject(value, null, type);
            }
        } else {
            return JSON.stringify(value);
        }
    }},

    /**
     @private
     */
    _serializeElement: {value: function(element) {
        if (element.id) {
            this._externalElements.push(element);
            return '{"#":"' + element.id + '"}';
        } else {
            throw "Error: Not possible to serialize a DOM element with no id assigned: " + element.outerHTML;
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

    _serializeFunction: {value: function(funktion) {
        var indent = arguments[1] || 0;
        var space = new Array(indent + 1).join("  ");
        var string = funktion.toString();

        var parseString = /^function[^(]*\(([^\)]+)\)\s*\{([\s\S]*)\}$/m.exec(string);
        return this._serializeValue({"->": {arguments: parseString[1].split(/\s*,\s*/), body: parseString[2]}}, null, indent);
    }}
});


if (typeof exports !== "undefined") {
    exports.Serializer = Serializer;
}
