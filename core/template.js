var Montage = require("montage").Montage,
    Deserializer = require("core/serialization").Deserializer,
    DocumentPart = require("core/document-part").DocumentPart,
    DocumentResources = require("core/document-resources").DocumentResources,
    Serialization = require("core/serialization/serialization").Serialization,
    MontageLabeler = require("core/serialization/serializer/montage-labeler").MontageLabeler,
    Promise = require("core/promise").Promise,
    logger = require("core/logger").logger("template"),
    defaultEventManager = require("core/event/event-manager").defaultEventManager,
    defaultApplication;

var Template = Montage.create(Montage, {
    _SERIALIZATON_SCRIPT_TYPE: {value: "text/montage-serialization"},
    _ELEMENT_ID_ATTRIBUTE: {value: "data-montage-id"},
    PARAM_ATTRIBUTE: {value: "data-param"},

    _require: {value: null},
    _resources: {value: null},
    document: {value: null},
    _baseUrl: {value: null},
    _instances: {value: null},
    _metadata: {value: null},

    _objectsString: {value: null},
    objectsString: {
        get: function() {
            return this._objectsString;
        },
        set: function(value) {
            this._objectsString = value;
            if (this._serialization) {
                this._serialization.initWithString(value);
            }
            // Invalidate the deserializer cache since there's a new
            // serialization in town.
            this.__deserializer = null;
        }
    },

    // Deserializer cache
    __deserializer: {value: null},
    _deserializer: {
        get: function() {
            var deserializer = this.__deserializer,
                metadata,
                requires;

            if (!deserializer) {
                metadata = this._metadata;
                if (metadata) {
                    requires = Object.create(null);
                    for (var label in metadata) {
                        requires[label] = metadata[label].require;
                    }
                }
                deserializer = Deserializer.create().init(this.objectsString,
                    this._require, requires);
                this.__deserializer = deserializer;
            }

            return deserializer;
        }
    },
    getDeserializer: {
        value: function() {
            return this._deserializer;
        }
    },

    _serialization: {
        value: null
    },
    getSerialization: {
        value: function() {
            var serialiation = this._serialization;

            if (!serialiation) {
                serialiation = this._serialization = Serialization.create();
                serialiation.initWithString(this.objectsString);
            }

            return serialiation;
        }
    },

    _templateCache: {
        value: {
            moduleId: Object.create(null)
        }
    },
    _getTemplateCacheKey: {
        value: function(moduleId, _require) {
            // Transforms relative module ids into absolute module ids
            moduleId = _require.resolve(moduleId);
            return _require.location + "#" + moduleId;
        }
    },
    getTemplateWithModuleId: {
        value: function(moduleId, _require) {
            var cacheKey,
                template;

            cacheKey = this._getTemplateCacheKey(moduleId, _require);
            template = this._templateCache.moduleId[cacheKey];

            if (!template) {
                template = Template.create()
                .initWithModuleId(moduleId, _require);

                this._templateCache.moduleId[cacheKey] = template;
            }

            return template;
        }
    },

    /**
     * Initializes the Template with an empty document.
     *
     * @function
     * @param {require} _require The require function used to load modules when
     *                           a template is instantiated.
     */
    initWithRequire: {
        value: function(_require) {
            this._require = _require;
            this.document = this.createHtmlDocumentWithHtml("");
            this.objectsString = "";

            return this;
        }
    },

    /**
     * Initializes the Template with a document.
     *
     * @function
     * @param {HTMLDocument} _document The document to be used as a template.
     * @param {require} _require The require function used to load modules when
     *                           a template is instantiated.
     * @returns {Promise} A promise for the proper initialization of the
     *                    template.
     */
    initWithDocument: {
        value: function(_document, _require) {
            var self = this;

            this._require = _require;
            this.setDocument(_document);

            return this.getObjectsString(_document)
            .then(function(objectsString) {
                self.objectsString = objectsString;
                return self;
            });
        }
    },

    /**
     * Initializes the Template with an HTML string.
     *
     * @function
     * @param {HTMLDocument} html The HTML string to be used as a template.
     * @param {require} _require The require function used to load modules when
     *                           a template is instantiated.
     * @returns {Promise} A promise for the proper initialization of the
     *                    template.
     */
    initWithHtml: {
        value: function(html, _require) {
            var self = this;

            this._require = _require;
            this.document = this.createHtmlDocumentWithHtml(html);

            return this.getObjectsString(this.document)
            .then(function(objectsString) {
                self.objectsString = objectsString;
                return self;
            });
        }
    },

    /**
     * Initializes the Template with Objects and a DocumentFragment to be
     * used as the body of the document.
     *
     * @function
     * @param {Object} objects A JSON'able representation of the objects of the
     *                         template.
     * @param {DocumentFragment} html The HTML string to be used as the body.
     * @param {require} _require The require function used to load modules when
     *                           a template is instantiated.
     * @returns {Promise} A promise for the proper initialization of the
     *                    template.
     */
    initWithObjectsAndDocumentFragment: {
        value: function(objects, documentFragment, _require) {
            var self = this;

            this._require = _require;
            this.document = this.createHtmlDocumentWithHtml("");
            this.document.body.appendChild(
                this.document.importNode(documentFragment)
            );
            this.setObjects(objects);

            return this;
        }
    },

    /**
     * Initializes the Template with the HTML document at the module id.
     *
     * @function
     * @param {String} moduleId The module id of the HTML page to load.
     * @param {require} _require The require function used to load modules when
     *                           a template is instantiated.
     * @returns {Promise} A promise for the proper initialization of the
     *                    template.
     */
    initWithModuleId: {
        value: function(moduleId, _require) {
            var self = this;

            this._require = _require;

            return this.createHtmlDocumentWithModuleId(moduleId, _require)
            .then(function(_document) {
                var baseUrl = _require(moduleId).directory;

                self.document = _document;
                self.setBaseUrl(baseUrl);

                return self.getObjectsString(_document)
                .then(function(objectsString) {
                    self.objectsString = objectsString;

                    return self;
                });
            });
        }
    },

    clone: {
        value: function() {
            var clonedTemplate = Template.create();

            clonedTemplate._require = this._require;
            clonedTemplate.setDocument(this.document);
            clonedTemplate.objectsString = this.objectsString;
            clonedTemplate._instances = Object.clone(this._instances, 0);

            return clonedTemplate;
        }
    },

    instantiate: {
        value: function(targetDocument) {
            return this.instantiateWithInstances(null, targetDocument);
        }
    },

    /**
     * @param instances {Object} The instances to use in the serialization
     *        section of the template, when given they will be used instead of
     *        creating a new object. It's dictionary where the keys are the
     *        labels and the values the instances.
     * @param targetDocument {Document} The document used to create the markup
     *        resultant of the instantiation.
     */
    instantiateWithInstances: {
        value: function(instances, targetDocument) {
            var self = this,
                fragment,
                part = DocumentPart.create(),
                templateObjects,
                templateParameters;

            instances = instances || this._instances;
            fragment = this._createMarkupDocumentFragment(targetDocument);
            templateParameters = this._getParameters(fragment);

            part.initWithTemplateAndFragment(this, fragment);
            part.startActingAsTopComponent();
            part.parameters = templateParameters;

            templateObjects = this._createTemplateObjects(instances);

            return this._instantiateObjects(templateObjects, fragment)
            .then(function(objects) {
                var resources;

                part.stopActingAsTopComponent();
                part.objects = objects;
                self._invokeDelegates(part, instances);

                resources = self.getResources();
                if (!resources.resourcesLoaded() && resources.hasResources()) {
                    return resources.loadResources(targetDocument)
                    .then(function() {
                        return part;
                    });
                } else {
                    return part;
                }
            });
        }
    },

    _objectsInstantiationOptimized: {
        value: false
    },
    _optimizeObjectsInstantiationPromise: {
        value: null
    },
    /**
     * @return {undefined|Promise} A promise if there are objects to optimize,
     *         nothing otherwise.
     */
    _optimizeObjectsInstantiation: {
        value: function() {
            var self = this,
                promise;

            if (!this._objectsInstantiationOptimized) {
                if (!this._optimizeObjectsInstantiationPromise) {
                    promise = this._deserializer.preloadModules();

                    if (promise) {
                        this._optimizeObjectsInstantiationPromise = promise
                        .then(function() {
                            self._objectsInstantiationOptimized = true;
                        });
                    } else {
                        this._objectsInstantiationOptimized = true;
                    }
                }

                return this._optimizeObjectsInstantiationPromise;
            }
        }
    },

    setBaseUrl: {
        value: function(baseUrl) {
            this._baseUrl = baseUrl;
        }
    },

    getBaseUrl: {
        value: function() {
            return this._baseUrl;
        }
    },

    getResources: {
        value: function() {
            var resources = this._resources;

            if (!resources) {
                resources = this._resources = TemplateResources.create();
                resources.initWithTemplate(this);
            }

            return resources;
        }
    },

    /**
     * Creates the object instances to be passed to the deserialization.
     * It takes instances and augments it with "application" and "template".
     *
     * @param {Object} instances The instances object.
     * @returns {Object} The object with instances and application and template.
     */
    _createTemplateObjects: {
        value: function(instances) {
            var templateObjects = Object.create(instances || null);

            if (typeof defaultApplication === "undefined") {
                defaultApplication = require("core/application").application;
            }

            templateObjects.application = defaultApplication;
            templateObjects.template = this;

            return templateObjects;
        }
    },

    _instantiateObjects: {
        value: function(instances, fragment) {
            var self = this,
                deserializer = this._deserializer,
                optimizationPromise;

            optimizationPromise = this._optimizeObjectsInstantiation();

            if (optimizationPromise) {
                return optimizationPromise.then(function() {
                    return deserializer.deserialize(instances, fragment);
                });
            } else {
                return deserializer.deserialize(instances, fragment);
            }
        }
    },

    _createMarkupDocumentFragment: {
        value: function(targetDocument) {
            var fragment = targetDocument.createDocumentFragment(),
                nodes = this.document.body.childNodes;

            for (var i = 0, ii = nodes.length; i < ii; i++) {
                fragment.appendChild(
                    targetDocument.importNode(nodes[i])
                );
            }

            return fragment;
        }
    },

    getParameterName: {
        value: function(element) {
            return element.getAttribute(this.PARAM_ATTRIBUTE);
        }
    },

    getParameters: {
        value: function() {
            return this._getParameters(this.document.body);
        }
    },

    _getParameters: {
        value: function(rootElement) {
            var elements = rootElement.querySelectorAll("*[" + this.PARAM_ATTRIBUTE + "]"),
                elementsCount = elements.length,
                element,
                parameters = {};

            for (var i = 0; i < elementsCount; i++) {
                element = elements[i];
                parameterName = this.getParameterName(element);

                if (parameterName in parameters) {
                    throw new Error('The parameter "' + parameterName + '" is' +
                        ' declared more than once in ' + this.getBaseUrl() +
                        '.');
                }

                parameters[parameterName] = element;
            }

            if ("*" in parameters && elementsCount > 1) {
                throw new Error('The star "*" template parameter was declared' +
                    ' when other parameters were also present in ' +
                    this.getBaseUrl() + ': ' + Object.keys(parameters) + '.');
            }

            return parameters;
        }
    },

    hasParameters: {
        value: function() {
            return !!this.document.querySelector("*[" + this.PARAM_ATTRIBUTE + "]");
        }
    },

    _invokeDelegates: {
        value: function(documentPart, instances) {
            var objects = documentPart.objects,
                object,
                owner = objects.owner;

            for (var label in objects) {
                // Don't call delegate methods on objects that were passed to
                // the instantiation.
                if (instances && label in instances) {
                    continue;
                }

                object = objects[label];

                if (object) {
                    if (typeof object._deserializedFromTemplate === "function") {
                        object._deserializedFromTemplate(owner, documentPart);
                    }
                    if (typeof object.deserializedFromTemplate === "function") {
                        object.deserializedFromTemplate(owner, documentPart);
                    }
                }
            }

            if (owner) {
                var serialization = this.getSerialization();

                // Don't call delegate methods on external objects
                if (!serialization.isExternalObject("owner")) {
                    if (typeof owner._templateDidLoad === "function") {
                        owner._templateDidLoad(documentPart);
                    }
                    if (typeof owner.templateDidLoad === "function") {
                        owner.templateDidLoad(documentPart);
                    }
                }
            }
        }
    },

    /**
     * Sets the instances to use when instantiating the objects of the template.
     * These instances will always be used when instantiating the template
     * unless a different set of instances is passed in
     * instantiateWithInstances().
     *
     * @function
     * @param {Object} instances The objects' instances.
     */
    setInstances: {
        value: function(instances) {
            this._instances = instances;
        }
    },

    getInstances: {
        value: function(instances) {
            return this._instances;
        }
    },

    setObjects: {
        value: function(objects) {
            // TODO: use Serializer.formatSerialization(object|string)
            this.objectsString = JSON.stringify(objects, null, 4);
        }
    },

    /**
     * Add metadata to specific objects of the serialization.
     *
     * @param {String} label The label of the object in the serialization.
     * @param {Require} _require The require function to be used when loading
     *        the module.
     * @param {String} effectiveLabel An alternative label to be given to the
     *        object.
     * @param {Object} owner The owner object to be given to the object.
     */
    setObjectMetadata: {
        value: function(label, _require, effectiveLabel, owner) {
            var metadata = this._metadata;

            if (!metadata) {
                this._metadata = metadata = Object.create(null);
            }

            metadata[label] = {
                "require": _require,
                "label": effectiveLabel,
                "owner": owner
            };

            // Invalidate the deserializer cache since we need to setup new
            // requires.
            this.__deserializer = null;
        }
    },

    getObjectMetadata: {
        value: function(label) {
            var metadata = this._metadata;

            if (metadata && label in metadata) {
                return metadata[label];
            } else {
                return {
                    "require": this._require,
                    "label": label
                }
            }
        }
    },

    /**
     * Uses the document markup as the base of the template markup.
     *
     * @function
     * @param {HTMLDocument} doc The document.
     * @returns {Promise} A promise for the proper initialization of the
     *                    document.
     */
    setDocument: {
        value: function(_document) {
            var html = _document.documentElement.innerHTML;

            this.document = this.createHtmlDocumentWithHtml(html);
        }
    },

    /**
     * Searches for objects in the document.
     * The objects string can live as an inline script in the document or as an
     * external resource that needs to be loaded.
     *
     * @function
     * @param {HTMLDocument} doc The document with the objects string.
     * @returns {Promise} A promise for the objects string, null if not
     *                    found.
     */
    getObjectsString: {
        value: function(doc) {
            var objectsString;

            objectsString = this.getInlineObjectsString(doc);

            if (objectsString === null) {
                return this.getExternalObjectsString(doc);
            } else {
                return Promise.resolve(objectsString);
            }
        }
    },

    /**
     * Searches for an inline objects string in a document and returns it if
     * found.
     * @function
     * @param {HTMLDocument} doc The document with the objects string.
     * @returns {(String|null)} The objects string or null if not found.
     */
    getInlineObjectsString: {
        value: function(doc) {
            var selector = "script[type='" + this._SERIALIZATON_SCRIPT_TYPE + "']",
                script = doc.querySelector(selector);

            if (script) {
                return script.textContent;
            } else {
                return null;
            }
        }
    },

    /**
     * Searches for an external objects file in a document and returns its
     * contents if found.
     *
     * @function
     * @param {String} doc The document to search.
     * @returns {Promise} A promise to the contents of the objects file or null
     *                    if none found.
     */
    getExternalObjectsString: {
        value: function(doc) {
            var link = doc.querySelector('link[rel="serialization"]'),
                req,
                url,
                rootUrl,
                deferred;

            if (link) {
                req = new XMLHttpRequest();
                url = link.getAttribute("href");
                rootUrl = this._documentRootUrl || "";

                if (! /^https?:\/\/|^\//.test(url)) {
                    url = rootUrl + url;
                } else {
                    return Promise.reject(
                        new Error("Relative link found for the objects file but the document URL is unknown: '" + url + "'.")
                    );
                }

                deferred = Promise.defer();

                req.open("GET", url);
                req.addEventListener("load", function() {
                    if (req.status == 200) {
                        deferred.resolve(req.responseText);
                    } else {
                        deferred.reject(
                            new Error("Unable to retrive '" + url + "', code status: " + req.status)
                        );
                    }
                }, false);
                req.addEventListener("error", function(event) {
                    deferred.reject(
                        new Error("Unable to retrive '" + url + "' with error: " + event.error + ".")
                    );
                }, false);
                req.send();

                return deferred.promise;
            } else {
                return Promise.resolve(null);
            }
        }
    },

    createHtmlDocumentWithHtml: {
        value: function(html) {
            var htmlDocument = document.implementation.createHTMLDocument("");

            htmlDocument.documentElement.innerHTML = html;

            return htmlDocument;
        }
    },

    createHtmlDocumentWithModuleId: {
        value: function(moduleId, _require) {
            var self = this;

            if (typeof _require !== "function") {
                return Promise.reject(
                    new Error("Missing 'require' function to load module '" + moduleId + "'.")
                );
            }

            return _require.async(moduleId).then(function(exports) {
                return self.createHtmlDocumentWithHtml(exports.content);
            });
        }
    },

    /**
     * Removes all artifacts related to objects string
     */
    _removeObjects: {
        value: function(doc) {
            var elements,
                selector = "script[type='" + this._SERIALIZATON_SCRIPT_TYPE + "'], link[rel='serialization']";

            Array.prototype.forEach.call(
                doc.querySelectorAll(selector),
                function (element) {
                   element.parentNode.removeChild(element);
                }
            );
        }
    },

    _addObjects: {
        value: function(doc, objectsString) {
            if (objectsString) {
                var script = doc.createElement("script");

                script.setAttribute("type", this._SERIALIZATON_SCRIPT_TYPE);
                script.textContent = JSON.stringify(JSON.parse(objectsString), null, 4);
                doc.head.appendChild(script);
            }
        }
    },

    _templateFromElementContentsCache: {
        value: null
    },
    createTemplateFromElementContents: {
        value: function(elementId) {
            var element,
                elementIds,
                labels,
                fragment,
                objectsString,
                template,
                range,
                serialization = Serialization.create(),
                extractedSerialization,
                cache = this._templateFromElementContentsCache;

            if (!cache) {
                cache = Object.create(null);
                this._templateFromElementContentsCache = cache;
            }

            if (elementId in cache) {
                // We always return an extension of the cached object, this
                // is because the template can be assigned with instances.
                // An alternate idea would be to clone it but it's much more
                // expensive.
                return Object.create(cache[elementId]);
            }

            // Find all elements of interest to the serialization.
            element = this.getElementById(elementId);
            elementIds = this._getChildrenElementIds(element);

            // Create a new serialization with the components found in the
            // element.
            serialization.initWithString(this.objectsString);
            labels = serialization.getSerializationLabelsWithElements(
                elementIds);
            extractedSerialization = serialization.extractSerialization(
                labels, ["owner"]);

            // Clone the element contents
            range = this.document.createRange();
            range.selectNodeContents(element);
            fragment = range.cloneContents();

            // Create the new template with the extracted serialization and
            // markup.
            template = Template.create();
            template.initWithObjectsAndDocumentFragment(
                null, fragment, this._require);
            template.objectsString = extractedSerialization
                .getSerializationString();
            template._resources = this.getResources();

            cache[elementId] = template;

            // We always return an extension of the cached object, this
            // is because the template is mutable.
            // An alternate idea would be to clone it but it's much more
            // expensive.
            return Object.create(template);
        }
    },

    // TODO: should this be on Serialization?
    _createSerializationWithElementIds: {
        value: function(elementIds) {
            var serialization = Serialization.create(),
                labels,
                extractedSerialization;

            serialization.initWithString(this.objectsString);
            labels = serialization.getSerializationLabelsWithElements(
                elementIds);

            extractedSerialization = serialization.extractSerialization(
                labels, ["owner"]);

            return extractedSerialization;
        }
    },

    /**
     * @param {Template} template The template object where the arguments reside
     * @param {Object} delegate A delegate object that needs to implement
     *        getTemplateParameterArgument(template, name) function that returns
     *        the argument to replace with the `name` parameter.
     * @returns {Object} A dictionary with four properties representing the
     *          objects and elements that were imported into the template:
     *          - labels: the labels of the objects added from template
     *                    argument.
     *          - labelsCollisions: a dictionary of label collisions in the form
     *                              of {oldLabel: newLabel}.
     *          - elementIds: the element ids of the markup imported from
     *                        template argument.
     *          - elementIdsCollisions: a dictionary of element id collisions in
     *                                  the form of {oldElementId: newElementId}
     *
     */
    expandParameters: {
        value: function(template, delegate) {
            var parameterElements,
                argumentsElementIds = [],
                collisionTable,
                argumentElementsCollisionTable = {},
                objectsCollisionTable,
                parameterElement,
                argumentElement,
                serialization = this.getSerialization(),
                argumentsSerialization,
                result = {};

            parameterElements = this.getParameters();

            // Expand elements.
            for (var parameterName in parameterElements) {
                parameterElement = parameterElements[parameterName];
                argumentElement = delegate.getTemplateParameterArgument(
                    template, parameterName);

                // Store all element ids of the argument, we need to create
                // a serialization with the components that point to them.
                argumentsElementIds.push.apply(argumentsElementIds,
                    this._getElementIds(argumentElement)
                );

                // Replace the parameter with the argument and save the
                // element ids collision table because we need to correct the
                // serialization that is created from the stored element ids.
                collisionTable = this.replaceNode(argumentElement, parameterElement);
                for (var key in collisionTable) {
                    argumentElementsCollisionTable[key] = collisionTable[key];
                }
            }
            result.elementIds = argumentsElementIds;
            result.elementIdsCollisions = argumentElementsCollisionTable;

            // Expand objects.
            argumentsSerialization = template
                ._createSerializationWithElementIds(argumentsElementIds);

            for (var elementId in argumentElementsCollisionTable) {
                argumentsSerialization.renameElementReference(elementId, argumentElementsCollisionTable[elementId]);
            }

            objectsCollisionTable = serialization.mergeSerialization(
                argumentsSerialization);
            this.objectsString = serialization.getSerializationString();

            result.labels = argumentsSerialization.getSerializationLabels();
            result.labelsCollisions = objectsCollisionTable;

            return result;
        }
    },

    /**
     * Takes a foreign node and generate new ids for all element ids that
     * already exist in the current template.
     */
    _resolveElementIdCollisions: {
        value: function(node) {
            var collisionTable = {},
                nodeElements,
                elementIds,
                element,
                newId,
                labeler = MontageLabeler.create();

            // Set up the labeler with the current element ids.
            elementIds = this.getElementIds();
            for (var i = 0, elementId; (elementId = elementIds[i]); i++) {
                labeler.setObjectLabel(null, elementId);
            }

            // Resolve element ids collisions.
            nodeElements = this._getElements(node);
            for (var elementId in nodeElements) {
                if (this.getElementById(elementId)) {
                    element = nodeElements[elementId];
                    newId = labeler.getObjectLabel(element);
                    this.setElementId(element, newId);
                    collisionTable[elementId] = newId;
                }
            }

            return collisionTable;
        }
    },

    replaceNode: {
        value: function(newNode, oldNode) {
            var collisionTable;

            collisionTable = this._resolveElementIdCollisions(newNode);
            oldNode.parentNode.replaceChild(newNode, oldNode);

            return collisionTable;
        }
    },

    insertNodeBefore: {
        value: function(node, reference) {
            var collisionTable;

            collisionTable = this._resolveElementIdCollisions(node);
            reference.parentNode.insertBefore(node, reference);

            return collisionTable;
        }
    },

    getElementId: {
        value: function(element) {
            if (element.getAttribute) {
                return element.getAttribute(this._ELEMENT_ID_ATTRIBUTE);
            }
        }
    },

    setElementId: {
        value: function(element, elementId) {
            element.setAttribute(this._ELEMENT_ID_ATTRIBUTE, elementId);
        }
    },

    getElementIds: {
        value: function() {
            return this._getElementIds(this.document.body);
        }
    },

    _getElements: {
        value: function(rootNode) {
            var selector = "*[" + this._ELEMENT_ID_ATTRIBUTE + "]",
                elements,
                result = {},
                elementId,
                nodes;

            elements = rootNode.querySelectorAll(selector);

            for (var i = 0, element; (element = elements[i]); i++) {
                elementId = this.getElementId(element);
                result[elementId] = element;
            }

            elementId = this.getElementId(rootNode);
            if (elementId) {
                result[elementId] = rootNode;
            }

            return result;
        }
    },

    _getChildrenElementIds: {
        value: function(rootNode) {
            // XPath might do a better job here...should test.
            var selector = "*[" + this._ELEMENT_ID_ATTRIBUTE + "]",
                elements,
                elementIds = [];

            elements = rootNode.querySelectorAll(selector);

            for (var i = 0, element; (element = elements[i]); i++) {
                elementIds.push(this.getElementId(element));
            }

            return elementIds;
        }
    },

    _getElementIds: {
        value: function(rootNode) {
            var elementIds = this._getChildrenElementIds(rootNode),
                elementId;

            elementId = this.getElementId(rootNode);
            if (elementId) {
                elementIds.push(elementId);
            }

            return elementIds;
        }
    },

    getElementById: {
        value: function(elementId) {
            var selector = "*[" + this._ELEMENT_ID_ATTRIBUTE + "='" + elementId + "']";

            return this.document.querySelector(selector);
        }
    },

    html: {
        get: function() {
            var _document = this.document;

            this._removeObjects(_document);
            this._addObjects(_document, this.objectsString);

            return _document.documentElement.outerHTML;
        }
    }
});

var TemplateResources = Montage.create(Montage, {
    _resources: {value: null},
    _resourcesLoaded: {value: false},
    template: {value: null},
    rootUrl: {value: ""},

    didCreate: {
        value: function() {
            this._resources = Object.create(null);
        }
    },

    initWithTemplate: {
        value: function(template) {
            this.template = template;
        }
    },

    hasResources: {
        value: function() {
            return this.getStyles().length > 0 || this.getScripts().length > 0;
        }
    },

    resourcesLoaded: {
        value: function() {
            return this._resourcesLoaded;
        }
    },

    loadResources: {
        value: function(targetDocument) {
            this._resourcesLoaded = true;

            return Promise.all([
                this.loadScripts(targetDocument),
                this.loadStyles(targetDocument)
            ]);
        }
    },

    getScripts: {
        value: function() {
            var scripts = this._resources.scripts,
                script,
                type,
                template,
                templateScripts;

            if (!scripts) {
                template = this.template;

                scripts = this._resources.scripts = [];
                templateScripts = template.document.querySelectorAll("script");

                for (var i = 0, ii = templateScripts.length; i < ii; i++) {
                    script = templateScripts[i];

                    if (script.type !== this.template._SERIALIZATON_SCRIPT_TYPE) {
                        scripts.push(script);
                    }
                }
            }

            return scripts;
        }
    },

    loadScripts: {
        value: function(targetDocument) {
            var scripts,
                promises = [];

            scripts = this.getScripts();

            for (var i = 0, ii = scripts.length; i < ii; i++) {
                promises.push(
                    this.loadScript(scripts[i], targetDocument)
                );
            }

            return Promise.all(promises);
        }
    },

    loadScript: {
        value: function(script, targetDocument) {
            var url,
                documentResources,
                newScript;

            documentResources = DocumentResources.getInstanceForDocument(targetDocument);
            // Firefox isn't able to load a script that we reuse, we need to
            // create a new one :(.
            //newScript = targetDocument.importNode(script);
            newScript = this._cloneScriptElement(script, targetDocument);

            return documentResources.addScript(newScript);
        }
    },

    _cloneScriptElement: {
        value: function(scriptTemplate, _document) {
            var script = _document.createElement("script"),
                attributes = scriptTemplate.attributes,
                attribute;

            for (var i = 0, ii = attributes.length; i < ii; i++) {
                attribute = attributes[i];

                script.setAttribute(attribute.name, attribute.value);
            }

            return script;
        }
    },

    getStyles: {
        value: function() {
            var styles = this._resources.styles,
                template,
                templateStyles,
                styleSelector;

            if (!styles) {
                styleSelector = 'link[rel="stylesheet"], style';
                template = this.template;

                templateStyles = template.document.querySelectorAll(styleSelector);

                styles = Array.prototype.slice.call(templateStyles, 0);
                this._resources.styles = styles;
            }

            return styles;
        }
    },

    loadStyles: {
        value: function(targetDocument) {
            var promises = [],
                styles;

            styles = this.getStyles();

            for (var i = 0, ii = styles.length; i < ii; i++) {
                promises.push(
                    this.loadStyle(styles[i], targetDocument)
                );
            }

            return Promise.all(promises);
        }
    },

    loadStyle: {
        value: function(element, targetDocument) {
            var url,
                documentResources,
                baseUrl = this.template.getBaseUrl();

            url = element.getAttribute("href");

            if (url) {
                documentResources = DocumentResources.getInstanceForDocument(targetDocument);

                url = documentResources.normalizeUrl(url, baseUrl);

                return documentResources.preloadResource(url);
            } else {
                return Promise.resolve();
            }
        }
    },

    createStylesForDocument: {
        value: function(targetDocument) {
            var styles = this.getStyles(),
                style,
                newStyle,
                stylesForDocument = [],
                baseUrl = this.template.getBaseUrl(),
                documentResources,
                url,
                normalizedUrl;

            documentResources = DocumentResources.getInstanceForDocument(targetDocument);

            for (var i = 0, style; (style = styles[i]); i++) {
                url = style.getAttribute("href");

                newStyle = targetDocument.importNode(style);
                stylesForDocument.push(newStyle);

                if (url) {
                    normalizedUrl = documentResources.normalizeUrl(url, baseUrl);
                    newStyle.setAttribute("href", normalizedUrl);
                }
            }

            return stylesForDocument;
        }
    }
});

// Used to create a DocumentPart from a document without a Template
function instantiateDocument(_document, _require) {
    var self = this,
        template = Template.create(),
        html = _document.documentElement.outerHTML,
        part = DocumentPart.create(),
        clonedDocument,
        templateObjects,
        rootElement = _document.documentElement;

    // Setup a template just like we'd do for a document in a template
    clonedDocument = Template.createHtmlDocumentWithHtml(html);

    return template.initWithDocument(clonedDocument, _require)
    .then(function() {
        // Instantiate it using the document given since we don't want to clone
        // the document markup
        templateObjects = template._createTemplateObjects();
        part.initWithTemplateAndFragment(template);

        return template._instantiateObjects(templateObjects, rootElement)
        .then(function(objects) {
            part.objects = objects;
            template._invokeDelegates(part);

            return part;
        });
    });
}

exports.Template = Template;
exports.TemplateResources = TemplateResources;
exports.instantiateDocument = instantiateDocument;
