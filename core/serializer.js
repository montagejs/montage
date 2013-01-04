/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
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
var Serializer = Montage.create(Montage, /** @lends module:montage/core/serializer.Serializer# */ {
    _INITIAL_LABEL_SEQUENCE_NUMBER: {value: 2}, // labels generation sequence is "label", "label2", "label3", ..., hence starting at 2
    _MONTAGE_ID_ATTRIBUTE: {value: "data-montage-id"},
    _serializedObjects: {value: Object.create(null)}, // label -> string
    _serializedReferences: {value: Object.create(null)}, // uuid -> string
    _externalObjects: {value: null}, // label -> object
    _externalElements: {value: null},
    _objectStack: {value: null},
    _objectReferences: {value: null}, // uuid -> object with properies
    // last used index of an objectName to create a label
    _objectNamesIndex: {value: null},
    _objectLabels: {value: null}, // uuid -> label
    _serializationUnits: {value: []},
    _serializationUnitsIndex: {value: Object.create(null)},

    serializeNullValues: {value: false},

    delegate: {value: null},

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
                label,
                serializeNullValues = this.serializeNullValues;

            this._serializedObjects = Object.create(null);
            this._serializedReferences = Object.create(null);
            this._externalObjects = Object.create(null);
            this._externalElements = [];
            this._objectNamesIndex = Object.create(null);
            this._objectLabels = Object.create(null);
            this._objectReferences = Object.create(null);

            for (label in objects) {
                if (objects[label] != null) {
                    this._objectLabels[objects[label].uuid] = label;
                }
                // need to store the labels in the object names index to
                // avoid conflicts when generating labels for other objects
                this._objectNamesIndex[label] = this._INITIAL_LABEL_SEQUENCE_NUMBER;
            }

            for (label in objects) {
                if (objects[label] != null || serializeNullValues) {
                    valueSerialization = this._serializeValue(objects[label], null, 2);
                    // objects are automatically inserted as top level objects after calling _serializeValue, but native objects have to be manually inserted them.
                    if (!(label in this._serializedObjects)) {
                        this._serializedObjects[label] = {value: valueSerialization};
                    }
                }
            }

            this._cleanupExternalObjects();
            serialization = this._getSerialization(this._serializedObjects, this._externalObjects);
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
                objectReferences[uuid] = Object.create(null);
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
                    objectReferences[uuid] = Object.create(null);
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

    _peekContextObject: {value: function() {
        return this._objectStack[this._objectStack.length-1];
    }},

    /**
     Returns a dictionary of the external objects that were referenced in the last serialization.
     @function
     @returns {object} The dictionary of external objects {label: object}
     */
    getExternalObjects: {value: function() {
        return this._externalObjects;
    }},

    _cleanupExternalObjects: {
        value: function() {
            var externalObjects = this._externalObjects,
                serializedObjects = this._serializedObjects;

            for (var label in externalObjects) {
                var object = externalObjects[label];
                if (serializedObjects[label]) {
                    delete externalObjects[label];
                }
            }
        }
    },

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
    _getSerialization: {value: function(objects, externalObjects) {
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

        for (var key in externalObjects) {
            objectsString.push('"' + key + '":{}');
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

    _labelRegexp: {
        enumerable: false,
        value: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/
    },

    _generateLabelForObject: {value: function(object) {
        var objectName = (this._labelRegexp.test(object.identifier) ? object.identifier : null) ||  Montage.getInfoForObject(object).objectName.toLowerCase(),
            index = this._objectNamesIndex[objectName];

        if (index) {
            this._objectNamesIndex[objectName] = index + 1;
            return objectName + index;
        } else {
            this._objectNamesIndex[objectName] = this._INITIAL_LABEL_SEQUENCE_NUMBER;
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
            return !("getInfoForObject" in object);
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
            label, moduleId, name, defaultName,
            delegate;

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
            delegate = this.delegate;
            this._serializedReferences[uuid] = serializedReference;

            serializedUnits = Object.create(null);
            objectInfo = Montage.getInfoForObject(object);

            if (!this._require) {
                throw new Error("Cannot serialize Montage objects without a require function to identify the corresponding package.");
            }

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
                this._pushContextObject(Object.create(null));
                object.serializeProperties(this, Montage.getSerializablePropertyNames(object));
                // handle delegate.serializeProperties for objects that
                // implement their own serializeProperties
                if (delegate && typeof delegate.serializeObjectProperties === "function") {
                    delegate.serializeObjectProperties(this, object,  Object.keys(this._peekContextObject()));
                }
                serializedUnits.properties = this._serializeObjectLiteral(this._popContextObject(), null, 3);
                this._popContextObject();
            } else {
                // if no set of properties were passed then serialize all the
                // serializable properties of the object itself.
                if (!properties) {
                    properties = object;
                    propertyNames = Montage.getSerializablePropertyNames(object);
                }
                // handle delegate.serializeProperties for objects that
                // do NOT implement their own serializeProperties
                if (delegate && typeof delegate.serializeObjectProperties === "function") {
                    this._pushContextObject(object);
                    this._pushContextObject(Object.create(null));
                    this.setAll(propertyNames);
                    delegate.serializeObjectProperties(this, object, propertyNames);
                    serializedUnits.properties = this._serializeObjectLiteral(this._popContextObject(), null, 3);
                    this._popContextObject();
                } else {
                    serializedUnits.properties = this._serializeObjectLiteral(properties, propertyNames, 3);
                }
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
            if (RegExp.isRegExp(value)) {
                return this._serializeRegExp(value);
            } else if (value != null && typeOfValue === "object" || typeOfValue === "function") {
                if (typeof Element !== "undefined" && Element.isElement(value)) {
                    return this._serializeElement(value);
                } else if (Array.isArray(value)) {
                    return this._serializeArray(value, indent + 1);
                } else if (value.constructor === Function) {
                    return this._serializeFunction(value, indent);
                } else if (!("getInfoForObject" in value)) { // we consider object literals the ones who aren't a Montage object
                    return this._serializeObjectLiteral(value, null, indent + 1);
                } else {
                    // TODO: should refactor this to handle references here, doesn't make
                    //       sense to wait until it hits _serializeObject for that to happen
                    //       if we already have that information here, also, we need to
                    //       support references to values in the future, not just objects.
                    if (typeof value.serializeSelf === "function" && !(value.uuid in this._serializedReferences) && type !== "reference") {
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
            this._pushContextObject({properties: Object.create(null), _units: []});
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
            id = attribute;

        if (id) {
            this._externalElements.push(element);
            return '{"#":"' + id + '"}';
        } else {
            logger.error("Error: Not possible to serialize a DOM element with no " + this._MONTAGE_ID_ATTRIBUTE + " assigned: " + element.outerHTML);
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
                serializationType = Montage.getPropertyAttribute(object, key, "serializable") || ((serializedReferenceProperties && Object.hasOwnProperty.call(serializedReferenceProperties, key)) ? "reference" : "auto");
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
            var label,
                delegate = this.delegate;

            if (!("prototype" in objectDescriptor || "object" in objectDescriptor || "value" in objectDescriptor)) {
                this._applyTypeUnit(objectDescriptor, object);
            }

            if ("value" in objectDescriptor) {
                return this._serializeValue(objectDescriptor.value);
            } else {
                // handle delegate.serializeProperties for objects that
                // implement their own serializeSelf
                if (delegate && typeof delegate.serializeObjectProperties === "function") {
                    this._pushContextObject(object);
                    this._pushContextObject(objectDescriptor.properties);
                    delegate.serializeObjectProperties(this, object,  Object.keys(objectDescriptor.properties));
                    this._popContextObject();
                    this._popContextObject();
                }
                objectDescriptor.properties = this._serializeObjectLiteral(objectDescriptor.properties, null, 3);
                var units;
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

/**
Creates a serialization for an object from the perspective of the
given package.
@function
@param {Object} object
@param require
@returns serialization
*/
function serialize(object, require) {
    return Serializer.create().initWithRequire(require).serializeObject(object);
}

if (typeof exports !== "undefined") {
    exports.Serializer = Serializer;
    exports.serialize = serialize;
}

