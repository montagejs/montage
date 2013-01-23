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
    @module montage/core/deserializer
    @requires montage/core/core
    @requires montage/core/core/logger
    @requires montage/core/promise
*/

var Montage = require("montage").Montage,
    logger = require("core/logger").logger("deserializer"),
    Promise = require("core/promise").Promise;

// By rebinding eval to a new name, it loses its ability to
// capture the calling scope.
var globalEval = eval;
var canEval = true;

// CSP doesn't let you eval
try {
    eval("");
} catch(ex) {
    canEval = false;
}

/**
 @class module:montage/core/deserializer.Deserializer
 @extends module:montage/core/core.Montage
 */
var Deserializer = exports.Deserializer = Montage.create(Montage, /** @lends module:montage/core/deserializer.Deserializer# */ {
    _MONTAGE_ID_ATTRIBUTE: {value: "data-montage-id"},

    _objects: {value: null},
   /**
  @private
*/
    _objectStack: {value: []},
    _modulesByRequire: {value: Object.create(null)},
    _modules: {value: null},
 /**
  @private
*/
    _requiredModuleIds: {value: null},
    _objectLabels: {value: null},
/**
  @private
*/
    _serializationString: {value: null, enumerable: false},
 /**
  @private
*/
    _serialization: {value: null, enumerable: false},
 /**
  @private
*/
    _parseFunction: {value: null, enumerable: false},
 /**
  @private
*/
    _deserializationUnits: {value: []},
    // name -> function
/**
  @private
*/

    /**
      @private
    */
    // list of ids that were just created for optimization
    _optimizedIds: {value: Object.create(null)},

    _indexedDeserializationUnits: {value: Object.create(null)},

    __sharedDocument: {
        value: null
    },

    _sharedDocument: {
        get: function() {
            return this.__cachedDoc ? this.__cachedDoc : (this.__cachedDoc = window.document.implementation.createHTMLDocument(""));
        }
    },
/**
  @private
*/
    _reset: {value: function() {
        this._serializationString = null;
        this._requiredModuleIds = null;
        this._areModulesLoaded = false;
        this._parseFunction = null;
        this._serialization = null;
        this._compiledDeserializationFunction = null;
        this._compiledDeserializationFunctionString = null;
        this._origin = null;
    }},

    _setupModulesForRequire: {
        value: function(require) {
            if (require) {
                var modules = this._modulesByRequire[require.uuid];

                if (modules) {
                    this._modules = modules;
                } else {
                    this._modules = this._modulesByRequire[require.uuid] = Object.create(null);
                }
            }
        }
    },

    /**
     Initializes the deserializer with a string
     @param {String|Object} serialization A string or JSON-style object
     describing the serialized objects.
     @param {Function} require The module loader for the containing package.
     @param {String} origin Usually a file name.
     */
    init: {
        value: function (serialization, require, origin) {
            if (typeof serialization !== "string") {
                serialization = JSON.stringify(serialization);
            }
            this._reset();
            this._serializationString = serialization;
            this._require = require;
            this._origin = origin;

            this._setupModulesForRequire(require);

            return this;
        }
    },

    /**
     Initializes the deserializer with a string of serialized objects.
     @function
     @param {String} string A string of serialized objects.
     @param {String} origin The origin of the serialization, usually a filename.
     @returns itself
     */
    initWithString: {value: function(string, origin) {
        this._reset();
        this._serializationString = string;
        this._origin = origin;
        this._setupModulesForRequire(this._require);
        return this;
    }},
    /**
    Initializes the deserializer object with an object representing a serialization. Since the serialization is a JSON string it is also possible to represent it in a JavaScript object.
    @function
    @param {object} object The serialization in JavaScript object form.
    @returns itself
    */
    initWithObject: {value: function(object) {
        this._reset();
        this._serializationString = JSON.stringify(object);
        this._setupModulesForRequire(this._require);
        return this;
    }},

    initWithObjectAndRequire: {value: function(object, require, origin) {
        this._reset();
        this._serializationString = JSON.stringify(object);
        this._require = require;
        this._origin = origin;

        this._setupModulesForRequire(require);

        return this;
    }},

    /**
     Initializes the deserializer object with a serialization string and the require object used to load the modules containing the object's prototypes.
     @function
     @param {string} string The serialization string.
     @param {function} require The require function to load the modules.
     @param {string} origin The origin of the serialization, usually a filename.
     @returns itself
     */
    initWithStringAndRequire: {value: function(string, require, origin) {
        this._reset();
        this._serializationString = string;
        this._require = require;
        this._origin = origin;

        this._setupModulesForRequire(require);

        return this;
    }},

    /**
     Defines a deserialization unit for an object.
     @function
     @param {string} name The unit name.
     @param {function} funktion The delegate function that reads the serialization unit and deserializes its content into the object being deserialized. This function accepts the object being deserialized and the serialized unit as arguments.
     */
    defineDeserializationUnit: {value: function(name, funktion) {
        this._deserializationUnits.push({
            name: name,
            funktion: this._indexedDeserializationUnits[name] = funktion
        });
    }},

    /**
     Returns an array with all the objects that were created or used during the call to deserializeWith* functions.
     @function
     @returns {Array} The array of objects.
     */
    getObjectsFromLastDeserialization: {value: function() {
        var objects = this._objects;
        var objectsArray = [];

        for (var key in objects) {
            if (Object.hasOwnProperty.call(objects, key)) {
                objectsArray.push(objects[key]);
            }
        }

        return objectsArray;
    }},

    chainDeserializer: {
        value: function(deserializer) {
            var chainedSerializations = this._chainedSerializations,
                optimizedIds, chainedOptimizedIds;

            if (!chainedSerializations) {
                this._chainedSerializations = chainedSerializations = [];
            }

            chainedSerializations.push({
                string: deserializer._serializationString,
                compiledFunction: deserializer._compiledDeserializationFunction,
                compiledFunctionString: deserializer._compiledDeserializationFunctionString
            });

            // need to copy the optimized ids too, ideally all chained templates are optimized for the same document
            chainedOptimizedIds = deserializer._optimizedIds;
            if (chainedOptimizedIds) {
                if (!optimizedIds) {
                    this._optimizedIds = optimizedIds = Object.create(null);
                }
                for (var id in chainedOptimizedIds) {
                    optimizedIds[id] = chainedOptimizedIds[id];
                }
            }
        }
    },

    /**
     This function is to be used in the context of deserializeProperties delegate used for custom object deserializations.
     It reads an entry from the "properties" serialization unit of the object being deserialized.
     @function
     @param {string} name The name of the entry to be read.
     @returns {*} The value of the entry
     */
    get: {value: function(name) {
        var stack = this._objectStack;
        var ix = stack.length - 1;

        return stack[ix][name];
    }},

    deserializeProperties: {
        value: function() {
            var stack = this._objectStack,
                ix = stack.length - 1,
                object = stack[ix-1],
                desc = stack[ix];

            this._deserializeProperties(object, desc.properties, false);
        }
    },

    getProperty: {
        value: function(name) {
            var stack = this._objectStack,
                ix = stack.length - 1,
                desc = stack[ix];

            return desc.properties[name];
        }
    },

    deserializeUnits: {
        value: function() {
            var stack = this._objectStack,
                ix = stack.length - 1,
                desc = stack[ix];

            desc._units = this._indexedDeserializationUnits;
        }
    },

    deserializeUnit: {
        value: function(name) {
            var stack = this._objectStack,
                ix = stack.length - 1,
                desc = stack[ix],
                units;

            if (desc._units) {
                units = desc._units;
            } else {
                desc._units = units = Object.create(null);
            }

            units[name] = this._indexedDeserializationUnits[name];
        }
    },

    getType: {
        value: function() {
            var stack = this._objectStack,
                ix = stack.length - 1,
                desc = stack[ix];

            return "object" in desc ? "object" : ("prototype" in desc ? "prototype" : null);
        }
    },

    getTypeValue: {
        value: function() {
            var stack = this._objectStack,
                ix = stack.length - 1,
                desc = stack[ix];

            return desc.object || desc.prototype;
        }
    },

    getObjectByLabel: {
        value: function(label) {
            return this._objects[label] || this._objectLabels[label];
        }
    },

    _customDeserialization: {
        enumerable: false,
        value: function(object, desc) {
            this._pushContextObject(object);
            this._pushContextObject(desc);
            object.deserializeSelf(this);
            this._popContextObject();
            this._popContextObject();
        }
    },

    /**
    This function is to be used in the context of deserializeProperties delegate used for custom object deserializations.
     It deserializes all the named properties of a serialized object into the object given.
    @function
    @param {Object} object The target of the properties.
    @param {Array} properties The property names to be deserialized.
    */
    deserializePropertiesForObject: {value: function(object, properties, checkSerializableAttribute) {
        if (checkSerializableAttribute) {
            for (var key in properties) {
                if (!Montage.getPropertyAttribute(object, key, "serializable")) {
                    if (Object.getPropertyDescriptor(object, key)) {
                        console.warn("Unserializable property \"" + key + "\" found in the serialization of " + (object._montage_metadata ? object._montage_metadata.objectName : object) + " (" + (this._origin || window.location) + ")");
                    } else {
                        console.warn("Nonexistent (and therefore unserializable) property \"" + key + "\" found in the serialization of " + (object._montage_metadata ? object._montage_metadata.objectName : object) + " (" + (this._origin || window.location) + ")");
                    }
                };
                object[key] = properties[key];
            }
        } else {
            for (var key in properties) {
                object[key] = properties[key];
            }
        }
    }},

    /**
    The function works on the top most object of an object stack.<br>
    This method pushes an object to that stack making it the target of future calls.
    @function
    @param {object} object The object to push into the stack.
    @private
     */
    _pushContextObject: {value: function(object) {
        this._objectStack.push(object);
    }},

    /**
     The function works on the top most object of an object stack.<br>
     This method pops the top most object out of that stack making future calls to target the next object in the stack.
     @function
     @returns {object} The top most object in the stack.
     @private
     */
    _popContextObject: {value: function() {
        return this._objectStack.pop();
    }},
/**
  @private
*/
    _require: {
        enumerable: false,
        value: null
    },
/**
  @private
*/
    _defaultModuleLoader: {
        enumerable: false,
        value: function(moduleIds, callback) {
            if (typeof require !== "function") {
                logger.error("Deserializer: The default module loader needs the global require function to be defined.");
                return;
            }

            var modulesLoaded = 0,
                modules = Object.create(null),
                _require = this._require;

            moduleIds.forEach(function(moduleId) {
                if (callback) {
                    _require.async(moduleId)
                    .then(function(module) {
                        modules[moduleId] = module;
                        if (++modulesLoaded === moduleIds.length) {
                            callback(modules);
                        }
                    }, function(error) {
                        console.log(error.stack);
                    })
                    .done();
                } else {
                    modules[moduleId] = _require(moduleId);
                }
            });

            if (!callback) {
                return modules;
            }
        }
    },

    /**
     Load modules.
     @param {Array} moduleIds The module ids to be loaded.
     @param {Function} callback The function to invoke when the modules are all loaded, passing this parameter makes this function asynchronous.
     @private
     */
    _areModulesLoaded: {value: false},
 /**
  @private
*/
    _areModulesLoading: {value: false},
/**
  @private
*/
    ___loadModulesCallbacks: {value: null},
/**
  @private
*/
    _loadModules: {
        enumerable: false,
        value: function(moduleIds, callback) {
            if (this._areModulesLoaded || moduleIds.length === 0) {
                if (callback) {
                    callback();
                }
            } else if (this._areModulesLoading) {
                this.___loadModulesCallbacks.push(callback);
            } else {
                var self = this;
                var moduleLoader = this._moduleLoader || this._defaultModuleLoader;

                this.___loadModulesCallbacks = [callback];
                this._areModulesLoading = true;
                // will add it as a Deserializer property if it's needed in the future (saves a closure creation for setting the "this")
                function addModules(newModules) {
                    var modules = self._modules;

                    for (var moduleId in newModules) {
                        if (Object.hasOwnProperty.call(newModules, moduleId)) {
                            modules[moduleId] = newModules[moduleId];
                        }
                    }

                    self._areModulesLoaded = true;
                    self._areModulesLoading = false;
                    self.___loadModulesCallbacks.forEach(function(callback) {
                        if (callback) {
                            callback();
                        }
                    });
                    self.___loadModulesCallbacks = null;
                }

                if (callback) {
                    moduleLoader.call(this, moduleIds, addModules);
                } else {
                    addModules(moduleLoader.call(this, moduleIds));
                }
            }
        }
    },
/**
  @private
*/
    _prepareForDeserialization: {value: function(callback) {
        if (this._areModulesLoaded) {
            return callback();
        }

        if (!this._compiledDeserializationFunctionString) {
            try {
                this._serialization = JSON.parse(this._serializationString);
            } catch (ex) {
                if (logger.isError) {
                    this._reportParseError(this._serializationString, this._origin);
                    return callback();
                }
            }
            this._parseForModules();
        }

        if (this._requiredModuleIds.length > 0) {
            this._loadModules(this._requiredModuleIds, callback);
        } else {
            this._areModulesLoaded = true;
            return callback();
        }
    }},

    /**
     Sets the module loader used during deserialization.
     @function
     @param {Function} loader The function that will load all module's found in the Array. The Array is composed of module id's to be loaded. When all modules are loaded the callback function should be invoked with an object that maps each module id to its corresponding module object, (e.g.: {"montage/ui/component": <the component module>}).
     */
    setModuleLoader: {value: function(loader) {
        this._moduleLoader = loader;
    }},
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
    _parseForModules: {value: function() {
        var serialization = this._serialization,
            moduleIds = this._requiredModuleIds = [],
            modules = this._modules,
            desc, moduleId;

        for (var label in serialization) {
            desc = serialization[label];
            moduleId = null;

            if ("module" in desc) {
                moduleId = desc.module;
            } else if ("prototype" in desc || "object" in desc) {
                Deserializer.parseForModuleAndName(desc.prototype || desc.object, desc);
                moduleId = desc.module;
            }

            if (moduleId && !modules[moduleId] && moduleIds.indexOf(moduleId) == -1) {
                moduleIds.push(moduleId);
            }
        }
    }},

    /**
     Sets the module loader used during deserialization.
     @function
     @param {String} name The string representing a module/name pair, such as "my-module[MyModule]".
     @param {Object} description The description object on which the parseForModuleAndName will populate the module and name properties. [Optional]
     @returns {Object} The description object with module and name properties populated.
     */
    parseForModuleAndName: {
        value: function(name, desc) {
            var bracketIndex;

            if (typeof desc === "undefined") {
                desc = Object.create(null);
            }
            bracketIndex = name.indexOf("[");
            if (bracketIndex > 0) {
                desc.module = name.substr(0, bracketIndex);
                desc.name = name.slice(bracketIndex+1, -1);
            } else {
                desc.module = name;
                Deserializer._findObjectNameRegExp.test(name);
                desc.name = RegExp.$1.replace(Deserializer._toCamelCaseRegExp, Deserializer._replaceToCamelCase);
            }
            return desc;
        }
    },

/**
  @private
*/
    _compile: {value: function() {
        this._prepareForDeserialization();
        this._compileAndDeserialize();
        return this._compiledDeserializationFunctionString;
    }},

    /**
     * Optimizes the current serialization for a specific document.
     * @function
     * @param {Document} doc The document to optimize against, this document can be modified during optimization.
    */
    optimizeForDocument: {
        value: function(doc) {
            var idAttributeName = Deserializer._MONTAGE_ID_ATTRIBUTE,
                elements = doc.querySelectorAll('*[' + idAttributeName + ']'),
                ids = this._optimizedIds = Object.create(null);

            for (var i = 0, element; (element = elements[i]); i++) {
                if (!element.id) {
                    var attribute = element.getAttribute(idAttributeName);
                    element.setAttribute("id", ids[attribute] = "_" + idAttributeName + "_" + attribute);
                }
            }
        }
    },

    _labelRegexp: {
        enumerable: false,
        value: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/
    },

/**
  @private
*/
    _compileAndDeserialize: {value: function(element, serialization, exports, deserialize) {
        var self = this,
            exportsStrings = "",
            unitsStrings = "",
            objectsStrings = "",
            cleanupStrings = "",
            valueString,
            deserialized = Object.create(null),
            modules = this._modules,
            idsToRemove = [],
            optimizedIds = this._optimizedIds,
            compiledDeserializationFunctionString,
            requireStrings = [],
            objectNamesCounter = Object.create(null),
            label,
            labelRegexp = this._labelRegexp,
            object;

        if (canEval) {
            serialization = this._serialization;
        } else {
            serialization = JSON.parse(this._serializationString);
        }

        for (label in serialization) {
            if (!labelRegexp.test(label)) {
                logger.error("Invalid label format '" + label + "' " + (this._origin ? " in " + this._origin : ""));
                throw "Invalid label format: " + label;
            }
            var objectDesc = serialization[label];

            if (label in deserialized) {
                // already deserialized, in a reference most likely
                continue;
            }

            if ("value" in objectDesc) {
                valueString = deserializeValue(objectDesc.value, objectDesc, "value");
                exportsStrings += 'var ' + label + ' = exports.' + label + ' = ' + valueString + ';\n';
                if (deserialize) {
                    exports[label] = objectDesc.value;
                    deserialized[label] = true;
                }
                // kind of lame but it's just to prevent the need to check whether it's a value or an object in the next serialization loop to deserialize the units.
                delete serialization[label];
            } else {
                deserializeObject(label, objectDesc);
            }
        }

        if (deserialize) {
            for (label in serialization) {
                self._deserializeUnits(exports[label], serialization[label]);
            }
            for (label in exports) {
                object = exports[label];
                if (object) {
                    delete object.isDeserializing;
                }
            }
        }

        if (idsToRemove.length > 0) {
            cleanupStrings += 'element.getElementById("' + idsToRemove.join('").removeAttribute("id");\nelement.getElementById("') + '").removeAttribute("id");';
            for (var i = 0, id; (id = idsToRemove[i]); i++) {
                element.getElementById(idsToRemove[i]).removeAttribute("id");
            }
        }

        if (canEval) {
            compiledDeserializationFunctionString = "(function() {\n" + requireStrings.join("\n") + "\nreturn function(element, exports) {\n" + exportsStrings + "\n\n" + objectsStrings + "\n\n" + unitsStrings + "\n\n" + cleanupStrings + "\nreturn exports;\n}}).call(this)";
        }
        if (logger.isDebug) {
            logger.debug(compiledDeserializationFunctionString);
        }

        return compiledDeserializationFunctionString;

        function deserializeObject(label, desc) {
            var moduleId,
                name,
                objectName,
                fqn,
                isType,
                object = self._objectLabels[label],
                hasObject = object != null,
                counter,
                descString,
                objectLocation,
                bracketIndex;

            if (Object.keys(desc).length == 0) {
                return;
            }

            if ("module" in desc) {
                moduleId = desc.module;
                objectName = name = desc.name;
            } else  if ("prototype" in desc || "object" in desc) {
                name = desc.prototype || desc.object;
                bracketIndex = name.indexOf("[");
                // this code is actually only used when canEval == false,
                // module+name are added when the modules are parsed but it's
                // slow to redo the _serializationString in order to keep the
                // added module+name when we do JSON.parse(_serializationString)
                // at canEval == false.
                if (bracketIndex > 0) {
                    moduleId = name.substr(0, bracketIndex);
                    objectName = name = name.slice(bracketIndex+1, -1);
                } else {
                    moduleId = name;
                    self._findObjectNameRegExp.test(name);
                    objectName = name = RegExp.$1.replace(self._toCamelCaseRegExp, function(_, g1) { return g1.toUpperCase() });
                }
            }
            isType = "object" in desc;
            fqn = moduleId + "." + name;

            if (deserialize) {
                if (hasObject) {
                    exports[label] = object;
                } else if (isType) {
                    exports[label] = object = modules[moduleId][name];
                } else {
                    if (!(name in modules[moduleId])) {
                        console.log("Warning: Object \"" + name + "\" not found at \"" + moduleId + "\" referenced from " + self._origin + ".");
                        return;
                    }
                    exports[label] = object = modules[moduleId][name].create();
                    Montage.getInfoForObject(object).label = label;
                    Object.defineProperty(object, "_suuid", {
                        enumerable: false,
                        value: self.uuid + "-" + label
                    });
                }
            }
            deserialized[label] = true;

            exportsStrings += 'if (this._objectLabels["' + label + '"]) {\n';
            exportsStrings += '  var ' + label + ' = exports.' + label + ' = this._objectLabels["' + label + '"];\n';
            exportsStrings += '} else if(exports.' + label +') {\n';
            exportsStrings += '  var ' + label + ' = exports.' + label + ';\n';
            if (!hasObject) {
                // this block of code is only needed for when there's a
                // prototype/object in the serialization, which is the common
                // case, but we also support missing object creation
                // information as long as the user defines an object to be used
                if (fqn in requireStrings) {
                    objectName = requireStrings[fqn];
                } else {
                    counter = (objectNamesCounter[name] || 0) + 1;
                    objectNamesCounter[name] = counter;
                    if (counter > 1) {
                        objectName += counter;
                    }
                    requireStrings[fqn] = objectName;
                    requireStrings.push('var ' + objectName + ' = this._modules["' + moduleId + '"]["' + name + '"];');
                }

                exportsStrings += '} else {\n';
                if (isType) {
                    exportsStrings += '  var ' + label + ' = exports.' + label + ' = ' + objectName + ';\n';
                } else {
                    exportsStrings += '  var ' + label + ' = exports.' + label + ' = ' + objectName + '.create();\n';
                    exportsStrings += '  Montage.getInfoForObject(' + label + ').label = "' + label + '";\n';
                    exportsStrings += '  Object.defineProperty(' + label + ', "_suuid", {enumerable: false, value: "' + self.uuid + '-' + label + '"});\n';
                }
            }
            exportsStrings += '}\n';

            descString = deserializeValue(desc);

            objectsStrings += 'var ' + label + 'Serialization = ' + descString + ';\n';
            objectsStrings += label + '.isDeserializing = true;\n';
            cleanupStrings += 'delete ' + label + '.isDeserializing;\n';
            objectsStrings += 'if (typeof ' + label + '.deserializeSelf === "function") {\n';
            objectsStrings += '  ' + label + 'Serialization._units = Object.create(null);\n';
            objectsStrings += '  this._customDeserialization(' + label + ', ' + descString + ');\n';
            objectsStrings += '} else {\n';
            objectsStrings += '  this._deserializeProperties(' + label + ', ' + label + 'Serialization.properties);\n';
            objectsStrings += '}\n';

            if (deserialize) {
                object.isDeserializing = true;
                if (typeof object.deserializeSelf === "function") {
                    desc._units = Object.create(null);
                    self._customDeserialization(object, desc);
                } else {
                    self._deserializeProperties(object, desc.properties, false);
                }
            }

            unitsStrings += 'this._deserializeUnits(' + label + ', ' + label + 'Serialization);\n';
        }

        function deserializeValue(value, parent, key) {
            var type = typeof value;

            if (type === "object") {
                if (value instanceof Array) {
                    type = "array";
                } else if (value === null) {
                    return "null";
                } else if ("#" in value) {
                    type = "elementByMontageId";
                    value = value["#"];
                } else if ("/" in value) {
                    type = "regexp";
                    value = value["/"];
                } else if ("@" in value) {
                    type = "reference";
                    value = value["@"];
                } else if ("->" in value) {
                    type = "function";
                    value = value["->"];
                } else if ("." in value && Object.keys(value).length === 1) {
                    console.log("Warning: It's not possible to reference elements by class name anymore: '" + JSON.stringify(value) + "' in template " + self._origin + ".");
                }
            }

            switch (type) {
                case "string":
                case "number":
                case "boolean":
                    return JSON.stringify(value);
                    break;

                case "object":
                    var properties = [];
                    for (var key in value) {
                        properties.push('"' + key + '": ' + deserializeValue(value[key], value, key));
                    }
                    return '{' + properties.join(",\n") + '}';
                    break;

                case "array":
                    var properties = [];
                    for (var i = 0, l = value.length; i < l; i++) {
                        properties.push(deserializeValue(value[i], value, i));
                    }
                    return '[' + properties.join(",\n") + ']';
                    break;

                case "elementByMontageId":
                    var id = self._optimizedIds[value],
                        node;

                    if (id) {
                        node = element.getElementById(id);
                        idsToRemove.push(id);
                    } else {
                        node = element.querySelector('*[' + Deserializer._MONTAGE_ID_ATTRIBUTE + '="' + value + '"]');
                        if (!node) {
                            node = element.getElementById(value);
                            id = value;
                        }
                    }

                    if (!node) {
                        console.log("Warning: Element " + Deserializer._MONTAGE_ID_ATTRIBUTE + "='" + value + "' not found in template " + self._origin);
                    }

                    if (deserialize) {
                        parent[key] = node;
                    }

                    if (id) {
                        return 'element.getElementById("' + id + '")';
                    } else {
                        return 'element.querySelector(\'*[' + Deserializer._MONTAGE_ID_ATTRIBUTE + '="' + value + '"]\')';
                    }
                    break;

                case "regexp":
                    if (deserialize) {
                        parent[key] = new RegExp(value.source, value.flags);
                    }
                    return "/" + value.source + "/" + value.flags;
                    break;

                case "reference":
                    var object,
                        originalValue = value;

                    if (value in exports) {
                        object = exports[value];
                    } else if (value in serialization) {
                        if (Object.keys(serialization[value]).length > 0) {
                            deserializeObject(value, serialization[value]);
                            object = exports[value];
                        } else {
                            object = self._objectLabels[value];
                            value = "this._objectLabels." + value;
                        }
                    } else {
                        logger.error("Error: Label '" + value + "' not found in serialization at " + self._origin);
                    }

                    if (parent) {
                        parent[key] = object;
                    }
                    if (typeof object === "undefined") {
                        logger.error("Missing object in serialization: '" + originalValue + "'" + (self._origin ? " in " + self._origin : ""));
                    }
                    return value;
                    break;

                case "function":
                    var source = "function" + (value.name ? " " + value.name : "") + "(" + value.arguments.join(", ") + ") {\n" + value.body + "\n}";
                    if (deserialize) {
                        parent[key] = globalEval('(' + source + ')');
                    }
                    return source;
                    break;
            }
        }
    }},

    /**
     * @private
     */
    _reportParseError: {value: function(source, origin) {
        require.async("core/jshint")
        .then(function(module) {
            var JSHINT = module.JSHINT;

            if (!JSHINT(source)) {
                var error = JSHINT.errors[0],
                    lines = source.split("\n"),
                    gutterPadding = "   ",
                    gutterSize = (gutterPadding + lines.length).length,
                    line = error.line - 1;

                for (var i = 0, l = lines.length; i < l; i++) {
                    lines[i] = (new Array(gutterSize - (i + 1 + "").length + 1)).join(i === line ? ">" : " ") + (i + 1) + " " + lines[i];
                }
                logger.error("Syntax error at line " + error.line + (origin ? " from " + origin : "") + ":\n" + error.evidence + "\n" + error.reason + "\n" + lines.join("\n"));
            } else {
                logger.error("Syntax error in the serialization but not able to find it!\n" + source);
            }
        })
        .done();
    }},

    /**
     * @private
     */
    _deserialize: {
        value: function(sourceDocument, targetDocument) {
            var exports = this._objects = Object.create(null),
                chainedSerializations = this._chainedSerializations;

            // third and next runs, execute the compiled deserialization function
            if (this._compiledDeserializationFunction) {
                this._compiledDeserializationFunction(sourceDocument, exports);
                // second run, create the function and execute it
            } else if (this._compiledDeserializationFunctionString) {
                this._compiledDeserializationFunction = eval(this._compiledDeserializationFunctionString);
                this._compiledDeserializationFunction(sourceDocument, exports);

                // first run, deserialize and create the source of the compiled deserialization function
            } else {
                this._compiledDeserializationFunctionString = this._compileAndDeserialize(sourceDocument, this._serialization, exports, true);
                this._serialization = null;
            }

            if (chainedSerializations) {
                for (var i = 0, serialization; (serialization = chainedSerializations[i]); i++) {
                    if (serialization.compiledFunction) {
                        serialization.compiledFunction.call(this, sourceDocument, exports);
                        // second run, create the function and execute it
                    } else if (serialization.compiledFunctionString) {
                        serialization.compiledFunction = eval(serialization.compiledFunctionString);
                        serialization.compiledFunction.call(this, sourceDocument, exports);
                        // first run, deserialize and create the source of the compiled deserialization function
                    } else {
                        serialization.compiledFunctionString = this._compileAndDeserialize(sourceDocument, serialization.object, exports, true);
                        serialization.object = null;
                    }
                }
            }

            if (targetDocument) {
                targetDocument.adoptNode(sourceDocument.body.firstChild);
            }

            return exports;
        }
    },

    /**
     Deserializes a serialization of a single object.
     @function
     @param {function(object)} callback The callback to be invoked when the object has been fully deserialized.
     */
    deserializeObject: {
        value: function(callback) {
            return this.deserializeWithInstancesAndDocument(null, null, function(exports) {
                callback(exports ? exports.root : undefined);
            });
        }
    },

    /**
     Deserializes a serialization of a single object using a root element to find elements' references.
     @function
     @param {Element} element The element to be cloned and used during deserialization of elements' references.
     @param {function(object)} callback The callback to be invoked when the object has been fully deserialized.
     */
    deserializeObjectWithElement: {
        value: function(element, callback) {
            return this.deserializeWithInstancesAndElementForDocument(null, element, null, function(exports, element) {
                callback(exports ? exports.root : undefined, element);
            });
        }
    },

    /**
     Deserializes all objects.
     @function
     @param {function(object)} callback The callback to be invoked when the object has been fully deserialized. The function will be called with a dictionary ({label: object}) with all deserialized objects.
     */
    deserialize: {
        value: function(callback) {
            return this.deserializeWithInstancesAndDocument(null, null, callback);
        }
    },

    /**
     Deserializes all objects by using instances instead of creating all objects from scratch.
     When an instance is given for a specific label the object that was serialized under that label won't be created and all the serialization units will be applied to the given instance instead.
     Obs: deserializedFromSerialization will still be called even though the object wasn't created during deserialization.
     @function
     @param {object} instances The dictionary ({label: instance}) with the instances to use for specific labels.
     @param {function(object)} callback The callback to be invoked when the object has been fully deserialized. The function will be called with a dictionary ({label: object}) with all deserialized objects.
     */
    deserializeWithInstances: {
        value: function(instances, callback) {
            return this.deserializeWithInstancesAndDocument(instances, null, callback);
        }
    },

    /**
     Same as deserializeWithInstances but giving an aditional Element and Document to use when deserializing elements' references.
     The element given will be cloned and all references will be to this cloned tree.
     Document will be used to create the cloned DOM tree.
     @function
     @param {object} instances The dictionary ({label: instance}) with the instances to use for specific labels.
     @param {Element} element The element to be cloned and used during deserialization of elements' references.
     @param {Document} targetDocument The Document to be used when cloning the DOM tree.
     @param {function(object)} callback The callback to be invoked when the object has been fully deserialized. The function will be called with a dictionary ({label: object}) with all deserialized objects.
     */
    deserializeWithInstancesAndElementForDocument: {
        value: function(instances, element, targetDocument, callback) {
            var self = this;

            this._prepareForDeserialization(function() {
                var exports,
                    sharedDocument = self._sharedDocument,
                    body = sharedDocument.body;


                self._objects = Object.create(null);
                self._objectLabels = instances || Object.create(null);

                if (element) {
                    body.appendChild(sharedDocument.importNode(element, true));
                }
                exports = self._deserialize(sharedDocument, targetDocument);

                self._invokeDeserializedFromSerialization(exports);

                callback(exports, body);
            });
        }
    },

    /**
     Same as deserializeWithInstances but giving an aditional Document to use when deserializing elements' references.
     All element's references will be applied against the given document.
     @function
     @param {object} instances The dictionary ({label: instance}) with the instances to use for specific labels.
     @param {Document} sourceDocument The Document to be used when searching for element's references.
     @param {function(object)} callback The callback to be invoked when the object has been fully deserialized. The function will be called with a dictionary ({label: object}) with all deserialized objects.
     */
    deserializeWithInstancesAndDocument: {
        value: function(instances, sourceDocument, callback) {
            var self = this;

            this._prepareForDeserialization(function() {
                self._objects = Object.create(null);
                self._objectLabels = instances || Object.create(null);

                var exports = self._deserialize(sourceDocument);

                self._invokeDeserializedFromSerialization(exports);
                callback(exports, sourceDocument);
            });
        }
    },

    /**
      @private
    */
    _invokeDeserializedFromSerialization: {value: function(objects) {
        var labels = this._objectLabels,
            object;

        for (var label in objects) {
            if (labels[label] != null) { // we should call deserializedFromSerialization on all instantiated objects even if they were passed as null/undefined in instances.
                continue;
            }
            object = objects[label];
            if (object !== null &&
                typeof object.deserializedFromSerialization === "function") {
                object.deserializedFromSerialization();
            }
        }
    }},

/**
  @private
*/
    _deserializeProperties: {value: function(object, properties, checkSerializableAttribute) {
        if (object.deserializeProperties) {
            this._pushContextObject(properties);
            object.deserializeProperties(this);
            this._popContextObject();
        } else {
            this.deserializePropertiesForObject(object, properties, checkSerializableAttribute);
        }
    }},

/**
  @private
*/
    _deserializeUnits: {value: function(object, serializedUnits) {
        var units = serializedUnits._units || this._indexedDeserializationUnits;

        for (var unit in units) {
            if (unit in serializedUnits) {
                units[unit](object, serializedUnits[unit], this);
            }
        }
    }}
});

/**
@function
@param {String} serialization
@param require
@returns promise for the serialized object
*/
var deserializer = Deserializer.create();
function deserialize(serialization, require, origin) {
    var deferred = Promise.defer();
    deserializer.init(serialization, require, origin)
    .deserializeObject(function (object) {
        deferred.resolve(object);
    });
    return deferred.promise;
}

exports.deserialize = deserialize;
