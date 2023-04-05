var Montage = require("./core").Montage,
    Deserializer = require("core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    DocumentPart = require("./document-part").DocumentPart,
    DocumentResources = require("./document-resources").DocumentResources,
    Serialization = require("./serialization/serialization").Serialization,
    MontageLabeler = require("./serialization/serializer/montage-labeler").MontageLabeler,
    Promise = require("./promise").Promise,
    URL = require("./mini-url"),
    logger = require("./logger").logger("template"),
    defaultEventManager = require("./event/event-manager").defaultEventManager,
    currentEnvironment = require("./environment").currentEnvironment,
    defaultApplication;

/**
 * @class Template
 * @extends Montage
 */
var Template = Montage.specialize( /** @lends Template# */ {
    _SERIALIZATION_SCRIPT_TYPE: {value: "text/montage-serialization"},
    _ELEMENT_ID_ATTRIBUTE: {value: "data-montage-id"},
    PARAM_ATTRIBUTE: {value: "data-param"},

    _require: {value: null},
    _resources: {value: null},
    _baseUrl: {value: null},
    _instances: {value: null},
    _metadata: {value: null},

    _objectsString: {value: null},
    objectsString: {
        get: function () {
            return this._objectsString;
        },
        set: function (value) {
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
        get: function () {
            var deserializer = this.__deserializer,
                metadata,
                requires;

            if (!deserializer) {
                metadata = this._metadata;
                if (metadata) {
                    requires = Object.create(null);

                    /* jshint forin: true */
                    for (var label in metadata) {
                    /* jshint forin: false */
                        requires[label] = metadata[label].require;
                    }
                }
                deserializer = new Deserializer().init(this.objectsString,
                    this._require, requires);
                this.__deserializer = deserializer;
            }

            return deserializer;
        }
    },
    //Unused anywhere
    // getDeserializer: {
    //     value: function () {
    //         return this._deserializer;
    //     }
    // },

    _serialization: {
        value: null
    },
    getSerialization: {
        value: function () {
            var serialiation = this._serialization;

            if (!serialiation) {
                serialiation = this._serialization = new Serialization();
                serialiation.initWithString(this.objectsString);
            }

            return serialiation;
        }
    },

    _isDirty: {
        value: false
    },

    isDirty: {
        get: function () {
            return this._isDirty;
        },
        set: function (value) {
            if (this._isDirty !== value) {
                this._isDirty = value;
                this.clearTemplateFromElementContentsCache();
            }
        }
    },

    /**
     * Object that knows how to refresh the contents of the template when it's
     * dirty. Expected to implement the refreshTemplate(template) function.
     */
    refresher: {
        value: null
    },

    _document: {
        value: null
    },

    document: {
        get: function () {
            if (this._isDirty) {
                this.refresh();
            }
            return this._document;
        },
        set: function (value) {
            this._document = value;
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
        value: function (_require) {
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
        value: function (_document, _require) {
            var self = this;

            this._require = _require;
            this.setDocument(_document);

            return this.getObjectsString(_document)
            .then(function (objectsString) {
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
        value: function (html, _require) {
            var self = this;

            this._require = _require;
            this.document = this.createHtmlDocumentWithHtml(html);

            return this.getObjectsString(this.document)
            .then(function (objectsString) {
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
        value: function (objects, documentFragment, _require) {
            this._require = _require;
            this.document = this.createHtmlDocumentWithHtml("");
            this.document.body.appendChild(
                this.document.importNode(documentFragment, true)
            );
            this.setObjects(objects);

            return this;
        }
    },

    /**
     * Initializes the Template with the HTML document at the module id.
     *
     * @function
     * @param {string} moduleId The module id of the HTML page to load.
     * @param {require} _require The require function used to load modules when
     *                           a template is instantiated.
     * @returns {Promise} A promise for the proper initialization of the
     *                    template.
     */
    initWithModuleId: {
        value: function (moduleId, _require) {
            var self = this;

            this._require = _require;

            return this.createHtmlDocumentWithModuleId(moduleId, _require)
            .then(function (_document) {
                var baseUrl = _require(moduleId).directory;

                self.document = _document;
                self.setBaseUrl(baseUrl);

                return self.getObjectsString(_document)
                .then(function (objectsString) {
                    self.objectsString = objectsString;

                    return self;
                });
            });
        }
    },

    clone: {
        value: function () {
            var clonedTemplate = new Template();

            clonedTemplate._require = this._require;
            clonedTemplate._baseUrl = this._baseUrl;
            clonedTemplate.setDocument(this.document);
            clonedTemplate.objectsString = this.objectsString;
            clonedTemplate._instances = Object.clone(this._instances, 1);

            return clonedTemplate;
        }
    },

    instantiate: {
        value: function (targetDocument) {
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
        value: function (instances, targetDocument) {
            var self = this,
                fragment,
                part = new DocumentPart(),
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
            .then(function (objects) {
                var resources = self.getResources();

                if (!resources.resourcesLoaded() && resources.hasResources()) {
                    // Start preloading the resources as soon as possible, no
                    // need to wait for them as the draw cycle will take care
                    // of that when loading the stylesheets into the document.
                    resources.loadResources(targetDocument);
                }

                part.objects = objects;
                self._invokeDelegates(part, instances);
                part.stopActingAsTopComponent();

                return part;
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
     * @returns {undefined|Promise} A promise if there are objects to optimize,
     *         nothing otherwise.
     */
    _optimizeObjectsInstantiation: {
        value: function () {
            var self = this,
                promise;

            if (!this._objectsInstantiationOptimized) {
                if (!this._optimizeObjectsInstantiationPromise) {
                    promise = this._deserializer.preloadModules();

                    if (promise) {
                        this._optimizeObjectsInstantiationPromise = promise
                        .then(function () {
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
        value: function (baseUrl) {
            this._baseUrl = baseUrl;
        }
    },

    getBaseUrl: {
        value: function () {
            return this._baseUrl;
        }
    },

    getResources: {
        value: function () {
            var resources = this._resources;

            if (!resources) {
                resources = this._resources = new exports.TemplateResources();
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
        value: function (instances) {
            var templateObjects = Object.create(instances || null);

            if (typeof defaultApplication === "undefined") {
                defaultApplication = require("./application").application;
            }

            templateObjects.application = defaultApplication;
            templateObjects.template = this;

            return templateObjects;
        }
    },

    _instantiateObjects: {
        value: function (instances, fragment) {
            var deserializer = this._deserializer,
                optimizationPromise;

            if (Promise.is(deserializer)) {
                return deserializer; // Promise return (error raised while deserializing)
            }

            optimizationPromise = this._optimizeObjectsInstantiation();

            if (optimizationPromise) {
                return optimizationPromise.then(function () {
                    return deserializer.deserialize(instances, fragment);
                });
            } else {
                return deserializer.deserialize(instances, fragment);
            }
        }
    },

    _createMarkupDocumentFragment: {
        value: function (targetDocument) {
            var fragment = targetDocument.createDocumentFragment(),
                nodes = this.document.body.childNodes;

            for (var i = 0, ii = nodes.length; i < ii; i++) {
                fragment.appendChild(
                    targetDocument.importNode(nodes[i], true)
                );
            }

            return fragment;
        }
    },

    getParameterName: {
        value: function (element) {
            return element.getAttribute(this.PARAM_ATTRIBUTE);
        }
    },

    getParameters: {
        value: function () {
            return this._getParameters(this.document.body);
        }
    },

    _getParameters: {
        value: function (rootElement) {
            var elements = rootElement.querySelectorAll("*[" + this.PARAM_ATTRIBUTE + "]"),
                elementsCount = elements.length,
                element,
                parameterName,
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

            return parameters;
        }
    },

    hasParameters: {
        value: function () {
            return !!this.document.querySelector("*[" + this.PARAM_ATTRIBUTE + "]");
        }
    },

    _invokeDelegates: {
        value: function (documentPart, instances) {
            var objects = documentPart.objects,
                object,
                owner = objects.owner || instances && instances.owner,
                objectOwner,
                objectLabel,
                i, keys, label;

            for (i=0, keys = Object.keys(objects);(label = keys[i]); i++) {

                // Don't call delegate methods on objects that were passed to
                // the instantiation.
                if (instances && label in instances) {
                    continue;
                }

                object = objects[label];
                // getObjectOwner will take into account metadata that might
                // have been set for this object. Objects in the serialization
                // of the template might have different owners. This is true
                // when an object in the serialization is the result of a
                // data-param that was expanded using arguments from an external
                // template.
                objectOwner = this._getObjectOwner(label, owner);
                objectLabel = this._getObjectLabel(label);

                if (object) {
                    if (typeof object._deserializedFromTemplate === "function") {
                        object._deserializedFromTemplate(objectOwner, objectLabel, documentPart);
                    }
                    if (typeof object.deserializedFromTemplate === "function") {
                        object.deserializedFromTemplate(objectOwner, objectLabel, documentPart);
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
        value: function (instances) {
            this._instances = instances;
        }
    },

    getInstances: {
        value: function () {
            return this._instances;
        }
    },

    setObjects: {
        value: function (objects) {
            // TODO: use Serializer.formatSerialization(object|string)
            this.objectsString = JSON.stringify(objects, null, 4);
        }
    },

    /**
     * Add metadata to specific objects of the serialization.
     *
     * @param {string} label The label of the object in the serialization.
     * @param {Require} _require The require function to be used when loading
     *        the module.
     * @param {string} effectiveLabel An alternative label to be given to the
     *        object.
     * @param {Object} owner The owner object to be given to the object.
     */
    setObjectMetadata: {
        value: function (label, _require, effectiveLabel, owner) {
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
        value: function (label) {
            var metadata = this._metadata;

            if (metadata && label in metadata) {
                return metadata[label];
            } else {
                return {
                    "require": this._require,
                    "label": label
                };
            }
        }
    },

    _getObjectOwner: {
        value: function (label, defaultOwner) {
            var objectOwner,
                metadata = this._metadata;

            if (metadata && label in metadata) {
                objectOwner = metadata[label].owner;
            } else {
                objectOwner = defaultOwner;
            }

            return objectOwner;
        }
    },

    _getObjectLabel: {
        value: function (label) {
            var objectLabel,
                metadata = this._metadata;

            if (metadata && label in metadata) {
                objectLabel = metadata[label].label;
            } else {
                objectLabel = label;
            }

            return objectLabel;
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
            this.document = this.cloneHtmlDocument(_document);

            this.clearTemplateFromElementContentsCache();
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
        value: function (doc) {
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
     *
     * @function
     * @param {HTMLDocument} doc The document with the objects string.
     * @returns {?String} The objects string or null if not found.
     */
    getInlineObjectsString: {
        value: function (doc) {
            var selector = "script[type='" + this._SERIALIZATION_SCRIPT_TYPE + "']",
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
     * @param {string} doc The document to search.
     * @returns {Promise} A promise to the contents of the objects file or null
     *                    if none found.
     */
    getExternalObjectsString: {
        value: function (doc) {
            var link = doc.querySelector('link[rel="serialization"]'),
                deferred;

            if (link) {
                // TODO use core/request
                deferred = new Promise(function(resolve, reject) {
                    var req = new XMLHttpRequest();
                    var url = link.getAttribute("href");
                    req.open("GET", url);
                    req.addEventListener("load", function(event) {
                        var req = event.target;
                        if (req.status === 200) {
                            resolve(req.responseText);
                        } else {
                            reject(
                                new Error("Unable to retrive '" + url + "', code status: " + req.status)
                            );
                        }
                    }, false);
                    req.addEventListener("error", function(event) {
                        reject(
                            new Error("Unable to retrive '" + url + "' with error: " + event.error + ".")
                        );
                    }, false);
                    req.send();

                });

                return deferred;
            } else {
                return Promise.resolve(null);
            }
        }
    },

    createHtmlDocumentWithHtml: {
        value: function (html, baseURI) {
            var htmlDocument = document.implementation.createHTMLDocument("");
            if (html) {
                htmlDocument.documentElement.innerHTML = html;
                if (baseURI) {
                    this.normalizeRelativeUrls(htmlDocument, baseURI);
                }
            }
            return htmlDocument;
        }
    },

    cloneHtmlDocument: {
        value: function (htmlDocument) {
            /*
             * Temporary fix for the function createHtmlDocumentWithHtml.
             *
             * Indeed, innerHTML does not allow us to have a document with some invalid HTML code,
             * that could belong to an iteration's template for example.
             *
             * Such as:
             *  <body><tr></tr></body> --> <body></body>
             *
             * Todo Plus, The DOMImplementation.createHTMLDocument() method has a parameter optional `title`
             * https://dom.spec.whatwg.org/#domimplementation
             *
             * Removing it will improve the performance, but it is not optional for IE.
             *
             */
            var clonedDocument = document.implementation.createHTMLDocument(""),
                baseURI = htmlDocument.baseURI || htmlDocument.URL;

            clonedDocument.replaceChild(
                clonedDocument.importNode(htmlDocument.documentElement, true),
                clonedDocument.documentElement
            );

            this.normalizeRelativeUrls(clonedDocument, baseURI);

            return clonedDocument;
        }
    },

    createHtmlDocumentWithModuleId: {
        value: function (moduleId, _require) {
            var self = this;

            if (typeof _require !== "function") {
                return Promise.reject(
                    new Error("Missing 'require' function to load module '" + moduleId + "'.")
                );
            }

            return _require.async(moduleId).then(function (exports) {
                return self.createHtmlDocumentWithHtml(exports.content, exports.directory);
            });
        }
    },

    /**
     * Removes all artifacts related to objects string
     */
    _removeObjects: {
        value: function (doc) {
            var selector = "script[type='" + this._SERIALIZATION_SCRIPT_TYPE + "'], link[rel='serialization']";

            Array.prototype.forEach.call(
                doc.querySelectorAll(selector),
                function (element) {
                    element.parentNode.removeChild(element);
                }
            );
        }
    },

    _addObjects: {
        value: function (doc, objectsString) {
            if (objectsString) {
                var script = doc.createElement("script");

                script.setAttribute("type", this._SERIALIZATION_SCRIPT_TYPE);
                script.textContent = JSON.stringify(JSON.parse(objectsString), null, 4);
                doc.head.appendChild(script);
            }
        }
    },

    _templateFromElementContentsCache: {
        value: null
    },
    clearTemplateFromElementContentsCache: {
        value: function () {
            this._templateFromElementContentsCache = null;
        }
    },

    createTemplateFromElementContents: {
        value: function (elementId) {
            var element,
                template,
                range,
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

            element = this.getElementById(elementId);

            // Clone the element contents
            range = this.document.createRange();
            range.selectNodeContents(element);

            // Create the new template with the extracted serialization and
            // markup.
            template = this.createTemplateFromRange(range);

            cache[elementId] = template;

            // We always return an extension of the cached object, this
            // is because the template is mutable.
            // An alternate idea would be to clone it but it's much more
            // expensive.
            return Object.create(template);
        }
    },

    createTemplateFromElement: {
        value: function (elementId) {
            var element,
                range;

            element = this.getElementById(elementId);

            // Clone the element contents
            range = this.document.createRange();
            range.selectNode(element);

            return this.createTemplateFromRange(range);
        }
    },

    createTemplateFromRange: {
        value: function (range) {
            var fragment,
                elementIds,
                labels,
                template,
                serialization = new Serialization(),
                extractedSerialization;

            fragment = range.cloneContents();

            // Find all elements of interest to the serialization.
            elementIds = this._getChildrenElementIds(fragment);

            // Create a new serialization with the components found in the
            // element.
            serialization.initWithString(this.objectsString);
            labels = serialization.getSerializationLabelsWithElements(
                elementIds);
            extractedSerialization = serialization.extractSerialization(
                labels, ["owner"]);

            // Create the new template with the extracted serialization and
            // markup.
            template = new Template();
            template.initWithObjectsAndDocumentFragment(
                null, fragment, this._require);
            template.objectsString = extractedSerialization
                .getSerializationString();
            template._resources = this.getResources();

            return template;
        }
    },

    // TODO: should this be on Serialization?
    _createSerializationWithElementIds: {
        value: function (elementIds) {
            var serialization = new Serialization(),
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
     * @param {TemplateArgumentProvider} templateArgumentProvider An object that
     *        implements the interface needed to provide the arguments to the
     *        parameters.
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
        value: function (templateArgumentProvider) {
            var parameterElements,
                argumentsElementIds = [],
                collisionTable,
                argumentElementsCollisionTable = {},
                objectsCollisionTable,
                parameterElement,
                argumentElement,
                serialization = this.getSerialization(),
                argumentsSerialization,
                willMergeObjectWithLabel,
                result = {};

            parameterElements = this.getParameters();

            // Expand elements.
            for (var parameterName in parameterElements) {
                if (parameterElements.hasOwnProperty(parameterName)) {
                    parameterElement = parameterElements[parameterName];
                    argumentElement = templateArgumentProvider.getTemplateArgumentElement(
                        parameterName);

                    if (parameterName === "*" && parameterElement.childElementCount > 0) { // has default
                        if (argumentElement && (argumentElement.childElementCount > 0 ||
                            !!(argumentElement.firstChild &&
                                argumentElement.firstChild.data &&
                                argumentElement.firstChild.data.trim()))
                        ) { // has arguments, need to clean the serialization.
                            var labels = serialization.getSerializationLabels();
                            serialization.removeObjectsWithLabels(
                                this._getChildrenElementIds(parameterElement)
                            );
                        } else {
                            var range = parameterElement.ownerDocument.createRange();
                            range.selectNodeContents(parameterElement);
                            this.replaceNode(range.extractContents(), parameterElement);

                            break;
                        }
                    }

                    // Store all element ids of the argument, we need to create
                    // a serialization with the components that point to them.
                    argumentsElementIds.push.apply(argumentsElementIds,
                        this._getElementIds(argumentElement)
                    );

                    // Replace the parameter with the argument and save the
                    // element ids collision table because we need to correct the
                    // serialization that is created from the stored element ids.
                    collisionTable = this.replaceNode(argumentElement, parameterElement);
                    if (collisionTable) {
                        /* jshint forin: true */
                        for (var key in collisionTable) {
                        /* jshint forin: false */
                            argumentElementsCollisionTable[key] = collisionTable[key];
                        }
                    }
                }
            }

            if (templateArgumentProvider._ownerDocumentPart) {
                result.elementIds = argumentsElementIds;
                result.elementIdsCollisions = argumentElementsCollisionTable;

                // Expand objects.
                argumentsSerialization = templateArgumentProvider
                    .getTemplateArgumentSerialization(argumentsElementIds);

                argumentsSerialization.renameElementReferences(
                    argumentElementsCollisionTable);

                // When merging the serializations we need to resolve any template
                // property alias that comes from the arguments, for instance, the
                // argument could be referring to @table:cell in its scope when in
                // this scope (the serialization1) it is aliased to
                // @repetition:iteration. To do this we ask the argument provider
                // to resolve the template property for us.
                // This approach works because the arguments serialization is
                // created assuming that template properties are just like any other
                // label and are considered external objects.
                willMergeObjectWithLabel = function (label) {
                    if (label.indexOf(":") > 0) {
                        return templateArgumentProvider
                            .resolveTemplateArgumentTemplateProperty(label);
                    }
                };

                objectsCollisionTable = serialization.mergeSerialization(
                    argumentsSerialization, {
                        willMergeObjectWithLabel: willMergeObjectWithLabel
                    });
                this.objectsString = serialization.getSerializationString();

                result.labels = argumentsSerialization.getSerializationLabels();
                result.labelsCollisions = objectsCollisionTable;
            }

            return result;
        }
    },

    /**
     * Takes a foreign node and generate new ids for all element ids that
     * already exist in the current template.
     */
    _resolveElementIdCollisions: {
        value: function (node, labeler) {
            var collisionTable,
                nodeElements,
                elementId,
                elementIds,
                element,
                newId;

            labeler = labeler || new MontageLabeler();
            // Set up the labeler with the current element ids.
            elementIds = this.getElementIds();
            for (var i = 0; (elementId = elementIds[i]); i++) {
                labeler.addLabel(elementId);
            }

            // Resolve element ids collisions.
            nodeElements = this._getElements(node);
            for (elementId in nodeElements) {
                if (this.getElementById(elementId)) {
                    element = nodeElements[elementId];
                    newId = labeler.generateLabel(labeler.getLabelBaseName(elementId));
                    this.setElementId(element, newId);
                    if (!collisionTable) {
                        collisionTable = Object.create(null);
                    }
                    collisionTable[elementId] = newId;
                }
            }

            return collisionTable;
        }
    },

    replaceNode: {
        value: function (newNode, oldNode, labeler) {
            var collisionTable;

            collisionTable = this._resolveElementIdCollisions(newNode, labeler);
            this.normalizeRelativeUrls(newNode, this.getBaseUrl());
            oldNode.parentNode.replaceChild(newNode, oldNode);

            return collisionTable;
        }
    },

    insertNodeBefore: {
        value: function (node, reference, labeler) {
            var collisionTable;

            collisionTable = this._resolveElementIdCollisions(node, labeler);
            this.normalizeRelativeUrls(node, this.getBaseUrl());
            reference.parentNode.insertBefore(node, reference);

            return collisionTable;
        }
    },

    appendNode: {
        value: function (node, parentNode, labeler) {
            var collisionTable;

            collisionTable = this._resolveElementIdCollisions(node, labeler);
            this.normalizeRelativeUrls(node, this.getBaseUrl());
            parentNode.appendChild(node);

            return collisionTable;
        }
    },

    getElementId: {
        value: function (element) {
            if (element.getAttribute) {
                return element.getAttribute(this._ELEMENT_ID_ATTRIBUTE);
            }
        }
    },

    setElementId: {
        value: function (element, elementId) {
            element.setAttribute(this._ELEMENT_ID_ATTRIBUTE, elementId);
        }
    },

    getElementIds: {
        value: function () {
            return this._getElementIds(this.document.body);
        }
    },

    _getElements: {
        value: function (rootNode) {
            var selector = "*[" + this._ELEMENT_ID_ATTRIBUTE + "]",
                elements,
                result = {},
                elementId;

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
        value: function (rootNode) {
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
        value: function (rootNode) {
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
        value: function (elementId) {
            var selector = "*[" + this._ELEMENT_ID_ATTRIBUTE + "='" + elementId + "']";

            return this.document.querySelector(selector);
        }
    },

    html: {
        get: function () {
            var _document = this.document;

            this._removeObjects(_document);
            this._addObjects(_document, this.objectsString);

            return this._getDoctypeString(_document.doctype) + "\n" +
                _document.documentElement.outerHTML;
        }
    },

    _getDoctypeString: {
        value: function (doctype) {
            return "<!DOCTYPE " +
                doctype.name +
                (doctype.publicId ? ' PUBLIC "' + doctype.publicId + '"' : '') +
                (!doctype.publicId && doctype.systemId ? ' SYSTEM' : '') +
                (doctype.systemId ? ' "' + doctype.systemId + '"' : '') +
                '>';
        }
    },

    normalizeRelativeUrls: {
        value: function (parentNode, baseUrl) {
            // Resolve component's images relative URLs if we have a valid baseUrl
            if (typeof baseUrl === "string" && baseUrl !== "" && baseUrl !== 'about:blank') {
                // We are only looking for DOM and SVG image elements
                var XLINK_NS = 'http://www.w3.org/1999/xlink',          // Namespace for SVG's xlink
                    absoluteUrlRegExp = /^[\w\-]+:|^\//,                // Check for "<protocol>:", "/" and "//",
                    nodes = Template._NORMALIZED_TAG_NAMES.indexOf(parentNode.tagName) !== -1 ?
                        [parentNode] : parentNode.querySelectorAll(Template._NORMALIZED_TAG_NAMES_SELECTOR);

                for (var i = 0, ii = nodes.length; i < ii; i++) {
                    var node = nodes[i],
                        url;

                    if (node.tagName === 'image') {
                        // SVG image
                        url = node.getAttributeNS(XLINK_NS, 'href');
                        if (!absoluteUrlRegExp.test(url)) {
                            node.setAttributeNS(XLINK_NS, 'href', URL.resolve(baseUrl, url));
                        }
                    } else {
                        // DOM image
                        if (node.hasAttribute("src")) {
                            url = node.getAttribute('src');
                            if (url !== "" && !absoluteUrlRegExp.test(url)) {
                                node.setAttribute('src', URL.resolve(baseUrl, url));
                            }
                        } else if (node.hasAttribute("href")) {
                            // Stylesheets
                            url = node.getAttribute('href');
                            if (url !== "" && !absoluteUrlRegExp.test(url)) {
                                node.setAttribute('href', URL.resolve(baseUrl, url));
                            }
                        } else if (node.hasAttribute("data")) {
                            // Stylesheets
                            url = node.getAttribute('data');
                            if (url !== "" && !absoluteUrlRegExp.test(url)) {
                                node.setAttribute('data', URL.resolve(baseUrl, url));
                            }
                        }
                    }
                }
            }

        }
    },

    replaceContentsWithTemplate: {
        value: function (template) {
            this._require = template._require;
            this._baseUrl = template._baseUrl;
            this._document = template._document;
            this.objectsString = template.objectsString;
            this._instances = template._instances;
            this._templateFromElementContentsCache = template._templateFromElementContentsCache;
            this._metadata = template._metadata;
        }
    },

    /**
     * Refresh the contents of the template when its dirty.
     */
    refresh: {
        value: function () {
            if (this.isDirty) {
                if (this.refresher &&
                    typeof this.refresher.refreshTemplate === "function") {
                    this.refresher.refreshTemplate(this);
                    this.isDirty = false;
                } else {
                    console.warn("Not able to refresh without a refresher.refreshTemplate.");
                }
            }
        }
    }

}, {

    _templateCache: {
        value: {
            moduleId: Object.create(null)
        }
    },
    _getTemplateCacheKey: {
        value: function (moduleId, _require) {
            // Transforms relative module ids into absolute module ids
            moduleId = _require.resolve(moduleId);
            return _require.location + "#" + moduleId;
        }
    },
    getTemplateWithModuleId: {
        value: function (moduleId, _require) {
            var cacheKey,
                template;

            cacheKey = this._getTemplateCacheKey(moduleId, _require);
            template = this._templateCache.moduleId[cacheKey];

            if (!template) {
                template = new Template()
                .initWithModuleId(moduleId, _require);

                this._templateCache.moduleId[cacheKey] = template;
            }

            return template;
        }
    },

    _NORMALIZED_TAG_NAMES: {
        value: ["IMG", "image", "object", "IFRAME", "link", "script"]
    },

    __NORMALIZED_TAG_NAMES_SELECTOR: {
        value: null
    },

    _NORMALIZED_TAG_NAMES_SELECTOR: {
        get: function () {
            if (!this.__NORMALIZED_TAG_NAMES_SELECTOR) {
                this.__NORMALIZED_TAG_NAMES_SELECTOR = this._NORMALIZED_TAG_NAMES.join(",");
            }
            return this.__NORMALIZED_TAG_NAMES_SELECTOR;
        }
    }

});

/**
 * @class TemplateResources
 * @extends Montage
 */
var TemplateResources = Montage.specialize( /** @lends TemplateResources# */ {
    _resources: {value: null},
    _resourcesLoaded: {value: false},
    template: {value: null},
    rootUrl: {value: ""},

    constructor: {
        value: function TemplateResources() {
            this._resources = Object.create(null);
        }
    },

    resolvedPromise: {
        get: function () {
            if (!TemplateResources._resolvedPromise) {
                TemplateResources._resolvedPromise = Promise.resolve();
            }
            return TemplateResources._resolvedPromise;
        }
    },

    initWithTemplate: {
        value: function (template) {
            this.template = template;
        }
    },

    hasResources: {
        value: function () {
            return this.getStyles().length > 0 || this.getScripts().length > 0;
        }
    },

    resourcesLoaded: {
        value: function () {
            return this._resourcesLoaded;
        }
    },

    loadResources: {
        value: function (targetDocument) {
            this._resourcesLoaded = true;

            return Promise.all([
                this.loadScripts(targetDocument),
                this.loadStyles(targetDocument)
            ]);
        }
    },

    getScripts: {
        value: function () {
            var scripts = this._resources.scripts,
                script,
                template,
                templateScripts;

            if (!scripts) {
                template = this.template;

                scripts = this._resources.scripts = [];
                templateScripts = template.document.querySelectorAll("script");

                for (var i = 0, ii = templateScripts.length; i < ii; i++) {
                    script = templateScripts[i];

                    if (script.type !== this.template._SERIALIZATION_SCRIPT_TYPE) {
                        scripts.push(script);
                    }
                }
            }

            return scripts;
        }
    },

    /*
        uses <link rel="preload" href="https://cdnjs.cloudflare.com/somescript.js" as="script" type="text/javascript" crossorigin>

        Similar to what's done in document-resources, and using it, but doing it here with links so it works cross origin
    */

    preloadScript: {
        value: function (script, targetDocument) {
            var documentResources = DocumentResources.getInstanceForDocument(targetDocument);

            if(documentResources.isResourcePreloaded(script.src)) {
                return Promise.resolve(script.src)
            } else if (documentResources.isResourcePreloading(script.src)) {
                return documentResources.getResourcePreloadedPromise(script.src);
            } else {

                var promise = new Promise(function(resolve, reject){

                    var preloadLink = document.createElement("link");
                    preloadLink.href = script.src;
                    preloadLink.rel = "preload";
                    preloadLink.as = "script";
                    preloadLink.type = "text/javascript";
                    preloadLink.crossOrigin = true;
                    targetDocument.head.appendChild(preloadLink);

                    var loadingTimeout;
                    // We wait until all scripts are loaded, this is important
                    // because templateDidLoad might need to access objects that
                    // are defined in these scripts, the downsize is that it takes
                    // more time for the template to be considered loaded.
                    var scriptLoadedFunction = function scriptLoaded(event) {
                        documentResources.setResourcePreloaded(script.src);
                        preloadLink.removeEventListener("load", scriptLoaded, false);
                        preloadLink.removeEventListener("error", scriptLoaded, false);

                        clearTimeout(loadingTimeout);
                        resolve(event);
                    };

                    preloadLink.addEventListener("load", scriptLoadedFunction, false);
                    preloadLink.addEventListener("error", scriptLoadedFunction, false);

                    // Setup the timeout to wait for the script until the resource
                    // is considered loaded. The template doesn't fail loading just
                    // because a single script didn't load.
                    //Benoit: It is odd that we act as if everything was fine here...
                    loadingTimeout = setTimeout(function () {
                        documentResources.setResourcePreloaded(script.src);
                        resolve();
                    }, documentResources._SCRIPT_TIMEOUT);


                });

                documentResources.setResourcePreloadedPromise(script.src, promise);

                return promise;

            }

        }
    },

    _loadSyncScripts: {
        value: function (script, targetDocument, syncScriptPromises) {
            var self = this,
                previousPromise = syncScriptPromises[syncScriptPromises.length-1] || Promise.resolve(true);

                if(false) {
                //if(currentEnvironment.supportsLinkPreload) {

            //Preload,
            //require.read used XHR which doesn't work without CORS cooperation from server
            // syncScriptPromises.push(require.read(script.src)
            //     .then( function() {
            //         return previousPromise
            //         .then( function() {
            //             self.loadScript(script, targetDocument);
            //         }, function(sriptsWithSrcLoadError) {
            //             return Promise.reject(sriptsWithSrcLoadError);
            //         });
            //     }, function(sriptsWithSrcLoadError) {
            //         return Promise.reject(sriptsWithSrcLoadError);
            //     }));

            syncScriptPromises.push(this.preloadScript(script, targetDocument)
                .then( function() {
                    return previousPromise
                    .then( function() {
                        self.loadScript(script, targetDocument);
                    }, function(sriptsWithSrcLoadError) {
                        return Promise.reject(sriptsWithSrcLoadError);
                    });
                }, function(sriptsWithSrcLoadError) {
                    return Promise.reject(sriptsWithSrcLoadError);
                }));


            } else {
                //We have no choice but load/execute serially to respect the spec.
                syncScriptPromises.push(previousPromise
                    .then( function() {
                        return self.loadScript(script, targetDocument);
                    }, function(sriptsWithSrcLoadError) {
                        return Promise.reject(sriptsWithSrcLoadError);
                    })
                );

            }


        }
    },
    loadScripts: {
        value: function (targetDocument) {
            var scripts = this.getScripts(),
                iScript,
                ii = scripts.length,
                self = this;

            if (ii) {
                var promises,
                    asyncPromises,
                    syncScriptPromises,
                    inlineScripts = [];

                for (var i = 0; i < ii; i++) {
                    if((iScript = scripts[i]).src) {
                        //If async, we load & insert at once
                        if(iScript.async) {
                            (asyncPromises || (asyncPromises = [])).push(
                                this.loadScript(iScript, targetDocument)
                            );
                        } else {
                            this._loadSyncScripts(iScript, targetDocument, (syncScriptPromises || (syncScriptPromises = [])));
                        }
                    } else {
                        inlineScripts.push(iScript);
                        self = self || this;
                    }
                }

                if(asyncPromises && syncScriptPromises) {
                    promises = asyncPromises.concat(syncScriptPromises);
                } else {
                    promises = asyncPromises || syncScriptPromises;
                }

                return Promise.all(promises)
                    .then(
                        function(resolvedScriptsWithSrc) {
                            var inlineScriptsPromises = [];

                            for (i = 0, ii=inlineScripts.length; i < ii; i++) {
                                inlineScriptsPromises.push(
                                    self.loadScript(inlineScripts[i], targetDocument)
                                );
                            }

                            return Promise.all(inlineScriptsPromises);

                        },
                        function(sriptsWithSrcLoadError) {
                            return sriptsWithSrcLoadError;
                        }
                    );
            }

            return this.resolvedPromise;
        }
    },

    loadScript: {
        value: function (script, targetDocument) {
            var documentResources,
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
        value: function (scriptTemplate, _document) {
            var script = _document.createElement("script"),
                attributes = scriptTemplate.attributes,
                attribute;

            for (var i = 0, ii = attributes.length; i < ii; i++) {
                attribute = attributes[i];

                script.setAttribute(attribute.name, attribute.value);
            }
            script.textContent = scriptTemplate.textContent;

            return script;
        }
    },

    getStyles: {
        value: function () {
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
        value: function (targetDocument) {
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
        value: function (element, targetDocument) {
            var url = element.getAttribute("href"),
                documentResources;

            if (url) {
                documentResources = DocumentResources.getInstanceForDocument(targetDocument);
                return documentResources.preloadResource(url);
            }

            return this.resolvedPromise;
        }
    },

    createStylesForDocument: {
        value: function (targetDocument) {
            var styles = this.getStyles(),
                newStyle,
                stylesForDocument = [];

            for (var i = 0, style; (style = styles[i]); i++) {
                newStyle = targetDocument.importNode(style, true);
                stylesForDocument.push(newStyle);
            }

            return stylesForDocument;
        }
    }
});

// Used to create a DocumentPart from a document without a Template
function instantiateDocument(_document, _require, instances) {
    var template = new Template(),
        html = _document.documentElement.outerHTML,
        part = new DocumentPart(),
        clonedDocument,
        templateObjects,
        rootElement = _document.documentElement;

    // Setup a template just like we'd do for a document in a template
    clonedDocument = template.createHtmlDocumentWithHtml(html, _document.location.href);

    return template.initWithDocument(clonedDocument, _require)
    .then(function () {
        template.setBaseUrl(_document.location.href);
        // Instantiate it using the document given since we don't want to clone
        // the document markup
        templateObjects = template._createTemplateObjects(instances);
        part.initWithTemplateAndFragment(template);

        return template._instantiateObjects(templateObjects, rootElement)
        .then(function (objects) {
            part.objects = objects;
            template._invokeDelegates(part);

            return part;
        });
    });
}

var TemplateArgumentProvider = Montage.specialize({
    /**
     * This function asks the provider to return the element that corresponds
     * to the argument with the same name. This element will be used to replace
     * the corresponding element with data-param of the template being expanded.
     * @param argumentName
     * @private
     */
    getTemplateArgumentElement: {
        value: Function.noop
    },

    /**
     * This function asks the provider to return the serialization components
     * that refer to the given element ids.
     * The serialization returned will be merged with the serialization of the
     * template being expanded.
     * @param elementIds
     * @private
     */
    getTemplateArgumentSerialization: {
        value: Function.noop
    },

    /**
     * This function asks the provider to resolve a template property that was
     * found in the argument serialization. The template property could be an
     * alias that only the provider knows how to resolve because they have
     * access to the template where the argument comes from and where the
     * aliases are defined in the serialization block (e.g: ":cell": {alias:
     * "@repetition:iteration"}).
     * @param templatePropertyLabel
     * @private
     */
    resolveTemplateArgumentTemplateProperty: {
        value: Function.noop
    }
});

exports.Template = Template;
exports.TemplateArgumentProvider = TemplateArgumentProvider;
exports.TemplateResources = TemplateResources;
exports.instantiateDocument = instantiateDocument;
