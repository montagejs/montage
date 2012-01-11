/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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

/**
 @class module:montage/core/deserializer.Deserializer
 @extends module:montage/core/core.Montage
 */
var Deserializer = Montage.create(Montage, /** @lends module:montage/core/deserializer.Deserializer# */ {
    _objects: {value: null},
   /**
  @private
*/
    _objectStack: {value: []},
    _modules: {value: {}},
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
    _indexedDeserializationUnits: {value: {}},

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
        this._parseFunction = null;
        this._serialization = null;
        this._compiledDeserializationFunction = null;
        this._compiledDeserializationFunctionString = null;
        this._origin = null;
    }},

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
            if (objects.hasOwnProperty(key)) {
                objectsArray.push(objects[key]);
            }
        }

        return objectsArray;
    }},
    /**
     This function is to be used in the context of deserializeSelf delegate used for custom object deserializations.
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

    /**
    This function is to be used in the context of deserializeSelf delegate used for custom object deserializations.
     It deserializes all the named properties of a serialized object into the object given.
    @function
    @param {Object} object The target of the properties.
    @param {Array} properties The property names to be deserialized.
    */
    deserializePropertiesForObject: {value: function(object, properties) {
        // TODO: ensure backward compatibility
        if (properties && "childComponents" in properties) {
            properties.childComponents = [];
            console.log('Warning: "childComponents" isn\'t supported on components within the current serializaation format, this property will be reset to [].');
        }
        for (var key in properties) {
            object[key] = properties[key];
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
                modules = {},
                _require = this._require;

            moduleIds.forEach(function(moduleId) {
                if (callback) {
                    Promise.when(_require.async(moduleId),
                        function(module) {
                            modules[moduleId] = module;
                            if (++modulesLoaded === moduleIds.length) {
                                callback(modules);
                            }
                        },
                        function(reason, error) {
                            console.log(error.stack);
                        }
                    );
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

                    if (!modules) {
                        modules = self._modules = {};
                    }
                    for (var moduleId in newModules) {
                        if (newModules.hasOwnProperty(moduleId)) {
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

        this._loadModules(this._requiredModuleIds, callback);
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
    _parseForModules: {value: function() {
        var serialization = this._serialization,
            moduleIds = this._requiredModuleIds = [],
            modules = this._modules;

        for (var label in serialization) {
            var desc = serialization[label];
            var moduleId = desc.module;

            if (moduleId && moduleIds.indexOf(moduleId) == -1 && !modules[moduleId]) {
                moduleIds.push(moduleId);
            }
        }
    }},
/**
  @private
*/
    _compile: {value: function() {
        this._prepareForDeserialization();
        this._compileAndDeserialize();
        return this._compiledDeserializationFunctionString;
    }},
/**
  @private
*/
    _compileAndDeserialize: {value: function(element, deserialize) {
        var self = this,
            serialization = this._serialization,
            exportsStrings = "",
            unitsStrings = "",
            objectsStrings = "",
            valueString,
            exports = {},
            modules = this._modules,
            requireStrings = [],
            objectNamesCounter = {},
            label;

        for (label in serialization) {
            var objectDesc = serialization[label];

            if (label in exports) {
                // already deserialized, in a reference most likely
                continue;
            }

            if ("value" in objectDesc) {
                valueString = deserializeValue(objectDesc.value, objectDesc, "value");
                exportsStrings += 'var ' + label + ' = exports.' + label + ' = ' + valueString + ';\n';
                if (deserialize) {
                    exports[label] = objectDesc.value;
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
        }

        this._compiledDeserializationFunctionString = "(function() {\n" + requireStrings.join("\n") + "\nreturn function(element) {\nvar exports = {};\n" + exportsStrings + "\n\n" + objectsStrings + "\n\n" + unitsStrings + "\nreturn exports;\n}}).call(this)";
        //console.log(this._compiledDeserializationFunctionString);

        this._serialization = serialization = null;

        return exports;

        function deserializeObject(label, desc) {
            var moduleId = desc.module,
                name = desc.name,
                objectName = name,
                fqn = moduleId + "." + name,
                properties = desc.properties,
                object,
                counter,
                propertiesString;

            if (deserialize) {
                if (self._objectLabels[label]) {
                    exports[label] = object = self._objectLabels[label];
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
            } else {
                // need to know if it has been already compiled
                exports[label] = true;
            }

            if (fqn in requireStrings) {
                name = requireStrings[fqn];
            } else {
                counter = (objectNamesCounter[name] || 0) + 1;
                objectNamesCounter[name] = counter;
                if (counter > 1) {
                    objectName += counter;
                }
                requireStrings[fqn] = objectName;
                requireStrings.push('var ' + objectName + ' = this._modules["' + moduleId + '"]["' + name + '"];');
            }

            exportsStrings += 'if (this._objectLabels["' + label + '"]) {\n';
            exportsStrings += '  var ' + label + ' = exports. ' + label + ' = this._objectLabels["' + label + '"]\n';
            exportsStrings += '} else {\n';
            exportsStrings += '  var ' + label + ' = exports. ' + label + ' = ' + objectName + '.create();\n';
            exportsStrings += '  Montage.getInfoForObject(' + label + ').label = "' + label + '";\n';
            exportsStrings += '  Object.defineProperty(' + label + ', "_suuid", {enumerable: false, value: "' + self.uuid + '-' + label + '"});\n';
            exportsStrings += '}\n';

            propertiesString = deserializeValue(properties);
            objectsStrings += 'this._deserializeProperties(' + label + ', ' + propertiesString + ');\n';
            if (deserialize) {
                self._deserializeProperties(object, properties);
            }

            delete desc.module;
            delete desc.name;
            delete desc.properties;

            propertiesString = deserializeValue(desc);
            if (propertiesString !== "{}") {
                unitsStrings += 'this._deserializeUnits(' + label + ', ' + propertiesString + ');\n';
            }
        }

        function deserializeValue(value, parent, key) {
            var type = typeof value;

            if (type === "object") {
                if (value instanceof Array) {
                    type = "array";
                } else if (value === null) {
                    return "null";
                } else if ("#" in value) {
                    type = "elementById";
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

                case "elementById":
                    if (deserialize) {
                        var node = element.getElementById(value);
                        if (!node) {
                            console.log("Warning: Element '#" + value + "' not found in template " + self._origin);
                        }
                        parent[key] = node;
                    }
                    return 'element.getElementById("' + value + '")';
                    break;

                case "regexp":
                    if (deserialize) {
                        parent[key] = new RegExp(value.source, value.flags);
                    }
                    return "/" + value.source + "/" + value.flags;
                    break;

                case "reference":
                    var object;

                    if (value in exports) {
                        object = exports[value];
                    } else if (value in serialization) {
                        deserializeObject(value, serialization[value]);
                        object = exports[value];
                    } else {
                        object = self._objectLabels[value];
                        value = "this._objectLabels." + value;
                    }

                    if (parent) {
                        parent[key] = object;
                    }
                    return value;
                    break;

                case "function":
                    var source = "function" + (value.name ? " " + value.name : "") + "(" + value.arguments.join(", ") + ") {\n" + value.body + "\n}";
                    if (deserialize) {
                        parent[key] = (1,eval)('(' + source + ')');
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
        require.async("core/jshint", function(module) {
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
        });
    }},

    /**
     * @private
     */
    _deserialize: {
        value: function(sourceDocument, targetDocument) {
            var exports;

            // third and next runs, execute the compiled deserialization function
            if (this._compiledDeserializationFunction) {
                exports = this._compiledDeserializationFunction(sourceDocument);
                // second run, create the function and execute it
            } else if (this._compiledDeserializationFunctionString) {
                this._compiledDeserializationFunction = eval(this._compiledDeserializationFunctionString);
                exports = this._compiledDeserializationFunction(sourceDocument);

                // first run, deserialize and create the source of the compiled deserialization function
            } else {
                exports = this._compileAndDeserialize(sourceDocument, true);
                //console.log(this._compiledDeserializationFunctionString);
            }

            if (targetDocument) {
                targetDocument.adoptNode(sourceDocument.body.firstChild);
            }

            return (this._objects = exports);
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


                self._objects = {};
                self._objectLabels = instances || {};

                if (element) {
                    body.appendChild(sharedDocument.importNode(element, true));
                }
                exports = self._deserialize(sharedDocument, targetDocument);

                self._invokeDeserializedFromSerialization(exports);

                callback(exports);
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
                self._objects = {};
                self._objectLabels = instances || {};

                var exports = self._deserialize(sourceDocument);

                self._invokeDeserializedFromSerialization(exports);
                callback(exports);
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
            if (label in labels) {
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
    _deserializeProperties: {value: function(object, properties) {
        object.isDeserializing = true;
        if (object.deserializeSelf) {
            this._pushContextObject(properties);
            object.deserializeSelf(this);
            this._popContextObject();
        } else {
            this.deserializePropertiesForObject(object, properties);
        }
        delete object.isDeserializing;
    }},

/**
  @private
*/
    _deserializeUnits: {value: function(object, serializedUnits) {
        var units = this._indexedDeserializationUnits;

        for (var unit in serializedUnits) {
            var unitFunction = units[unit];
            if (unitFunction) {
                if (serializedUnits[unit].text) {
                    //debugger;
                }
                unitFunction(object, serializedUnits[unit]);
            }
        }
    }}
});

if (typeof exports !== "undefined") {
    exports.Deserializer = Deserializer;
}
