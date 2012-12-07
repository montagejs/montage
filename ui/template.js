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
    @module montage/ui/template
    @requires montage/core
    @requires montage/core/serializer
    @requires montage/core/deserializer
    @requires montage/core/logger
    @requires montage/core/event/event-manager

    @requires montage/ui/application
*/

exports = typeof exports !== "undefined" ? exports : {};

var Montage = require("montage").Montage;
var Serializer = require("core/serializer").Serializer;
var Deserializer = require("core/deserializer").Deserializer;
var logger = require("core/logger").logger("template");
var defaultEventManager = require("core/event/event-manager").defaultEventManager;
var defaultApplication;

/**
    @class module:montage/ui/template.Template
    @extends module:montage/core/core.Montage
*/
var Template = exports.Template = Montage.create(Montage, /** @lends module:montage/ui/template.Template# */ {

/**
    The value of the type assigned to a Montage script block.
    @type {string}
    @private
*/
    _OLD_SCRIPT_TYPE: {value: "text/m-objects"},
    _SCRIPT_TYPE: {value: "text/montage-serialization"},

/**
    @private
*/
    _document: {
        enumerable: false,
        value: null
    },

    document: {
        get: function() {
            return this._document;
        }
    },
/**
    @private
*/
    _require: {value: window.require},
    _externalObjects: {value: null},
    _ownerSerialization: {value: null},
    _rootUrl: {value: null},
/**
    @private
*/
    _isLoaded: {value: false},

    delegate: {value: null},

    /**
    Creates a new Template instance from an HTML document element.
    @function
    @return {module:montage/template.Template}
    */
    initWithDocument: {value: function(doc, requireFunction) {
        if (requireFunction) {
            this._require = requireFunction;
        }
        this._document = doc;

        return this;
    }},

    __templatesById: {value: {}},
    __templateCallbacksByModuleId: {value: {}},

    /**
    Finds (or creates) the apropriate Template object to be used on a specific module id that represents an HTML page.
    Any Template object can be used but this function guarantees that only one template object is used per module id reducing the number of objects needed.
    @function
    @param {Function} requireFunction The require function to load the template file.
    @param {String} moduleId The module id.
    @param {Function} callback The function to call when the template is ready, receives a Template object as a parameter.
    */
    templateWithModuleId: {value: function(requireFunction, moduleId, callback) {
        var templateKey = requireFunction.location + moduleId,
            template = this.__templatesById[templateKey]

        var templateCallback = function(template) {
            template.__templateCallbacksByModuleId[templateKey].forEach(function(value) {
                value.call(this,template);
            });
            delete template.__templateCallbacksByModuleId[templateKey];
        };

        if(!template) {
            this.__templateCallbacksByModuleId[templateKey] = [callback];
            this.__templatesById[templateKey] = (template = this.create().initWithModuleId(requireFunction, moduleId, templateCallback));
        } else if(!template._isLoaded) {
            this.__templateCallbacksByModuleId[templateKey].push(callback);
        }
        else {
            callback(template);
        }
        return template;
    }},

    /**
    Creates a (or uses a previously created one) Template object out of a fully instantiated component.
    This means creating a markup from the Component object's element and a serialization with the Component object as the owner of the Template.
    This function guarantees that only one Template object is used per type of component reducing the number of objects needed.
    @function
    @param {Function} requireFunction The require function to use to load the modules used in the serialization.
    @param {String} moduleId The module id.
    @param {Function} callback The function to call when the template is ready, receives a Template object as a parameter.
    */
    templateWithComponent: {value: function(component, delegate) {
        var componentId = component._templateId,
            template = this.__templatesById[componentId],
            externalObjects;

        if (!template) {
            template = this.create();
            template.delegate = delegate;
            template.initWithComponent(component);
            externalObjects = template._externalObjects;
            // don't store this template if it has external objects, the next component to use might have diferent objects for the same ids
            if (!externalObjects || Object.keys(externalObjects).length === 0) {
                this.__templatesById[componentId] = template;
            }
        }

        return template;
    }},

    /**
     Private reference to template's deserializer.
     @private
    */
    _deserializer: {value:null},

    /**
    The deserializer object used by the template.
    @type {module:montage/core/deserializer.Deserializer}
    */
    deserializer: {
        get: function() {
            return this._deserializer || (this._deserializer = Deserializer.create().initWithString(this._rootObjectSerialization));
        }
    },

    initWithHtmlString: {
        value: function(htmlString) {
            var doc = this.createHtmlDocumentFromString(htmlString);

            this._isLoaded = true;
            this.initWithDocument(doc);

            return this;
        }
    },

    /**
    Initializes the Template object with a specific module id that represents an HTML page.
    @function
    @param {Function} requireFunction The require function to load the template file.
    @param {String} moduleId The module id.
    @param {Function} callback The function to call when the template is initialized, receives a Template object as a parameter.
    @returns itself
    */
    initWithModuleId: {value: function(requireFunction, moduleId, callback) {
        var self = this;

        this._require = requireFunction;
        this.createHtmlDocumentFromModuleId(requireFunction, moduleId, function(doc) {
            if (!doc) {
                throw "Template '" + moduleId + "' not found.";
            }
            self._isLoaded = true;
            self.initWithDocument(doc);
            if (callback) {
                callback(self);
            }
        });
        return this;
    }},

    /**
     @private
     */
    _serializer: {
        value: null
    },

    /**
    The serializer object used by the template.
    @type {module:montage/core/serializer.Serializer}
    */
    serializer: {
        get: function() {
            return this._serializer || (this._serializer = Serializer.create().initWithRequire(this._require));
        }
    },

    // serializer delegate method
    serializeObjectProperties: {
        enumerable: false,
        value: function() {
            var delegate = this.delegate;

            if (delegate && typeof delegate.serializeObjectProperties === "function") {
                return delegate.serializeObjectProperties.apply(delegate, arguments);
            }
        }
    },

    /**
     Initializes a Template object out of a fully instantiated component.
     This means creating a markup from the Component object's element and a serialization with the Component object as the owner of the Template.
     @function
     @param {Object} component The component with which to initialize the template.
     @returns itself
     */
    initWithComponent: {value: function(component) {
        var htmlDocument = document.implementation.createHTMLDocument(""),
            serializer = this.serializer,
            serialization,
            elements, element,
            elementsCount, e1, e2;

        this._document = htmlDocument;

        serializer.delegate = this.delegate ? this : null;
        this._ownerSerialization = serializer.serialize({owner: component});
        this._externalObjects = serializer.getExternalObjects();
        elements = serializer.getExternalElements();

        var elementsCount = elements.length;
        if (elementsCount > 1) {
            // reduce elements to its top fringe O(n^2) ... could probably reduce this (in avg) by removing all children of the component's element first
            for (var i = 0; i < elementsCount; i++) {
                e1 = elements[i];
                for (var j = 0; j < elementsCount; j++) {
                    if (i !== j) {
                        var e2 = elements[j];
                        // is e2 contained in e1?
                        while ((e2 = e2.parentNode) && e2 !== e1) {
                        };
                        if (e2) {
                            elements.splice(j, 1);
                            elementsCount--;
                            j--;
                            if (i > j) {
                                i--;
                            }
                        }
                    }
                }
            }
        }

        for (var i = 0; element = elements[i]; i++) {
            htmlDocument.body.appendChild(htmlDocument.importNode(element, true))
        }
        // make sure we use the same require used to create this component to instantiate this reel
        this._deserializer = this._createDeserializer(this._ownerSerialization);

        return this;
    }},

    optimize: {
        value: function() {
            this.deserializer.optimizeForDocument(this._document);
        }
    },

    _deserialize: {
        value: function(instances, targetDocument, callback) {
            if ( typeof defaultApplication === "undefined") {
                defaultApplication = require("ui/application").application;
            }

            var self = this;

            this.getDeserializer(function(deserializer) {
                var externalObjects;

                if (deserializer) {
                    externalObjects = self._externalObjects;
                    if (externalObjects) {
                        for (var label in externalObjects) {
                            if (!(label in instances)) {
                                instances[label] = externalObjects[label];
                            }
                        }
                    }

                    instances.application = defaultApplication;
                    instances.template = self;

                    if (self._document === window.document) {
                        deserializer.deserializeWithInstancesAndDocument(instances, self._document, callback);
                    } else {
                        deserializer.deserializeWithInstancesAndElementForDocument(instances, self._document.body, targetDocument, callback);
                    }
                } else {
                    callback();
                }
            });
        }
    },

    /**
     Instantiates the Template by specifying an object as the owner and a document where the elements referenced in the serialization should be found.
     @function
     @param {Object} rootObject The owner object of the template.
     @param {HTMLDocument} document The HTML document to be used to find elements referenced from the serialization.
     @param {Function} callback The callback function to invoke when the template is instantiated.
    */
    instantiateWithOwnerAndDocument: {
        value: function(owner, targetDocument, callback) {
            return this.instantiateWithInstancesAndDocument({owner: owner}, targetDocument, callback);
        }
    },

    instantiateWithInstancesAndDocument: {
        value: function(instances, targetDocument, callback) {
            var self = this;

            this._partiallyInstantiateWithInstancesForDocument(instances, targetDocument, function(objects) {
                if (objects) {
                    // TODO: this should be in the same function that creates them but
                    // then I would always have to create another function just for
                    // that... let's sneak it in here for the time being..
                    delete instances.application;
                    delete instances.template;
                    self._invokeTemplateDidLoad(objects, objects.owner && objects.owner.templateObjects);
                }
                self.waitForStyles(function() {
                    callback(objects ? objects.owner : null);
                });
            });
        }
    },

    /**
     Instantiates the Template by using a component as the owner.
     All elements refereced in the serialization will be found on the document the component is attached to.
     @function
     @param {Component} component The Component object to be used as a owner.
     @param {Function} callback The callback function to invoke when the template is instantiated.
     */
    // TODO: we should think about having a component-template.js that extends
    //       template.js, this object is starting to have too much information
    //       about the inner workings of the Component.
    instantiateWithComponent: {value: function(component, callback) {
        var self = this,
            instances = component.templateObjects;

        if (instances) {
            instances.owner = component;
        } else {
            instances = {owner: component};
        }

        this._partiallyInstantiateWithInstancesForDocument(instances, component.element.ownerDocument, function(objects) {
            delete instances.owner;
            delete instances.application;
            delete instances.template;

            if (objects) {
                self._invokeTemplateDidLoad(objects, !component._isTemplateLoaded && instances);
            }
            self.waitForStyles(function() {
                callback(objects ? objects.owner : null);
            });
        });
    }},

    instantiateWithDocument: {
        value: function(document, callback) {
            return this.instantiateWithOwnerAndDocument(null, document, callback);
        }
    },

    _partiallyInstantiateWithInstancesForDocument: {
        value: function(instances, targetDocument, callback) {
            var self = this,
                owner = instances.owner;

            if (!targetDocument && owner && owner._element) {
                targetDocument = owner._element.ownerDocument;
            }

            function importHeaders(objects) {
                if (self._document !== targetDocument) {
                    self.exportHeaders(targetDocument);
                }
                callback(objects);
            }

            this._deserialize(instances, targetDocument, function(objects, element) {
                if (self._extends && !self._isExpanded) {
                    var _extends = self._extends,
                        element = _extends.element,
                        instances = _extends.instances,
                        instancesMapping = _extends.instancesMapping,
                        elementId = _extends.elementId;

                    if (!element && elementId) {
                        element = element.querySelector("*[data-montage-id='" + elementId + "']");
                    }

                    if (!instances) {
                        if (instancesMapping) {
                            instances = {};
                            for (var label in instancesMapping) {
                                instances[label] = objects[instancesMapping[label]];
                            }
                            instances.owner = objects.owner;
                        } else {
                            instances = {owner: objects.owner};
                        }
                    }
                    self._extendsTemplateWithInstances(_extends.templateModuleId, element, instances, function(extendsObjects) {
                        var labels = Object.keys(extendsObjects);

                        for (var i =0, label; (label = labels[i]); i++) {
                            objects[label] = extendsObjects[label];
                        }
                        importHeaders(objects);
                    });
                } else {
                    importHeaders(objects);
                }
            });
        }
    },

    /**
     Instantiates the Template with no elements references.
     @function
     */
    instantiate: {
        value: function(callback) {
            return this.instantiateWithOwnerAndDocument(null, null, callback);
        }
    },

    _templateObjectDescriptor: {
        value: {
            enumerable: true,
            configurable: true
        }
    },

    _createTemplateObjectGetter: {
        value: function(owner, label) {
            var querySelectorLabel = "@"+label,
                isRepeated,
                components,
                component;

            return function templateObjectGetter() {
                if (isRepeated) {
                    return owner.querySelectorAllComponent(querySelectorLabel, owner);
                } else {
                    components = owner.querySelectorAllComponent(querySelectorLabel, owner);
                    // if there's only one maybe it's not repeated, let's go up
                    // the tree and found out.
                    if (components.length === 1) {
                        component = components[0];
                        while (component = component.parentComponent) {
                            if (component === owner) {
                                // we got to the owner without ever hitting a component
                                // that repeats its child components, we can
                                // safely recreate this property with a static value
                                Object.defineProperty(this, label, {
                                    value: components[0]
                                });
                                return components[0];
                            } else if (component.clonesChildComponents) {
                                break;
                            }
                        }
                    }

                    isRepeated = true;
                    return components;
                };
            };
        }
    },

    /**
     @private
     */
    _invokeTemplateDidLoad: {
        value: function(objects, templateObjects) {
            var owner = objects.owner,
                labels = Object.keys(objects),
                label,
                hasTemplateDidDeserializeObject = owner && typeof owner.templateDidDeserializeObject === "function";

            for (var i = 0, object; (object = objects[label = labels[i]]); i++) {
                if (owner !== object) {
                    if (typeof object._deserializedFromTemplate === "function") {
                        object._deserializedFromTemplate(owner);
                    }
                    if (typeof object.deserializedFromTemplate === "function") {
                        object.deserializedFromTemplate(owner);
                    }
                    if (hasTemplateDidDeserializeObject) {
                        owner.templateDidDeserializeObject(object);
                    }
                    if (templateObjects) {
                        if (object.parentComponent === owner || !object.ownerComponent) {
                            templateObjects[label] = object;
                        } else {
                            this._templateObjectDescriptor.get = this._createTemplateObjectGetter(object.ownerComponent, label);
                            Object.defineProperty(templateObjects, label, this._templateObjectDescriptor);
                        }
                    }
                }
            }

            if (owner) {
                if (typeof owner._templateDidLoad === "function") {
                    owner._templateDidLoad();
                }
                if (typeof owner.templateDidLoad === "function") {
                    owner.templateDidLoad();
                }
            }
        }
    },

    defineExtension: {
        value: function(templateModuleId, elementId, instances) {
            this._extends = {
                templateModuleId: templateModuleId,
                element: elementId,
                instancesMapping: instances
            }
        }
    },

    _extendsTemplateWithInstances: {
        value: function(templateModuleId, element, instances, callback) {
            var self = this,
                owner = instances.owner,
                ownerTemplateElement,
                ownerTemplateDocument;

            // replace destination with the nodes inside source, merge the attributes from source with attributesElement
            function importNodes(source, destination, attributesElement) {
                var nextSibling = destination.nextSibling,
                    parentNode = destination.parentNode,
                    nodes = source.childNodes,
                    attributes = source.attributes;

                parentNode.removeChild(destination);
                if (nextSibling) {
                    for (var i = 0, l = nodes.length; i < l; i++) {
                        parentNode.insertBefore(nodes[0], nextSibling);
                    }
                } else {
                    for (var i = 0, l = nodes.length; i < l; i++) {
                        parentNode.appendChild(nodes[0]);
                    }
                }

                for (var i = 0, attribute; (attribute = attributes[i]); i++) {
                    var attributeName = attribute.nodeName;
                    if (attributeName === "id" || attributeName === "data-montage-id") {
                        continue;
                    } else {
                        var value = (attributesElement.getAttribute(attributeName) || "") + " " + attribute.nodeValue;
                    }

                    attributesElement.setAttribute(attributeName, value);
                }
            }

            ownerTemplateElement = owner._templateElement;
            ownerTemplateDocument = ownerTemplateElement.ownerDocument;

            // reset this property in order to use it at the extended template
            owner._templateElement = null;

            Template.templateWithModuleId(this._require, templateModuleId, function(template) {
                template._partiallyInstantiateWithInstancesForDocument({owner: owner}, ownerTemplateDocument, function(objects) {
                    importNodes(owner._templateElement, element, ownerTemplateElement);
                    if (!self._isExpanded) {
                        var elementId = self.getMontageIdByElement(element),
                            ownerTemplateElementId = self.getMontageIdByElement(ownerTemplateElement),
                            templateElementId = self.getMontageIdByElement(owner._templateElement);

                        importNodes(
                            self._document.importNode(template.getMontageElementById(templateElementId), true),
                            self.getMontageElementById(elementId),
                            self.getMontageElementById(ownerTemplateElementId)
                        );
                        template.exportHeaders(self._document);
                        self._isExpanded = true;
                    }
                    self._deserializer.chainDeserializer(template._deserializer);
                    owner._templateElement = ownerTemplateElement;
                    callback(objects);
                });
            });
        }
    },

    getMontageIdByElement: {
        value: function(element) {
            return element.getAttribute("data-montage-id") || element.id;
        }
    },

    getMontageElementById: {
        value: function(id) {
            return this._document.querySelector("*[data-montage-id='" + id + "']") ||
                   this._document.getElementById(id);
        }
    },

    /**
     Inserts all styles and scripts found in the Template object into the document given.
     @function
     @param {HTMLDocument} doc The document to insert the styles and scripts.
     */
    exportHeaders: {value: function(doc) {
        this.insertStylesInDocumentIfNeeded(doc);
        this.insertScriptsInDocumentIfNeeded(doc);
    }},

    /**
     @private
    */
    _stylesLoadedCount: {
        enumerable: false,
        value: null
    },

    /**
     @private
    */
    _expectedStylesLoadedCount: {
        enumerable: false,
        value: null
    },

    /**
     @private
    */
    _stylesLoadedCallbacks: {
        enumerable: false,
        value: null
    },

    /**
     Inserts all styles found in the Template object into the document given.
     This function is idempotent, it will not insert styles that are already in the document.
     @function
     @param {HTMLDocument} doc The document to insert the styles.
     */
    insertStylesInDocumentIfNeeded: {value: function(doc) {
        var importedStyles = doc._montage_importedStyles,
            templateId = this._id,
            fromTemplates;

        if (!templateId || !doc) {
            return;
        }

        if (!importedStyles) {
            importedStyles = doc._montage_importedStyles = {
                fromTemplates: {},
                fromLinks: {}
            };
            //Montage.defineProperty(doc, "_styledComponents", {
            //    enumerable: false,
            //    writable: false,
            //    value: []
            //});
        }

        fromTemplates = importedStyles.fromTemplates;

        if(templateId in fromTemplates) {
            return;
        } else {
            fromTemplates[templateId] = true;
        }

        var self = this,
            rootUrl = this._rootUrl,
            documentHead = doc.head,
            callbacks = this._stylesLoadedCallbacks = [],
            cssTags = this._document.querySelectorAll('link[rel="stylesheet"], style'),
            cssTagsCount = cssTags.length,
            fromLinks = importedStyles.fromLinks,
            // let's use a document fragment if there is more than one element, faster to insert in the DOM.
            container = cssTagsCount > 1 ? doc.createDocumentFragment() : documentHead,
            url;

        this._stylesLoadedCount = 0;
        this._expectedStylesLoadedCount = 0;

        for (var i = 0, cssTag; (cssTag = cssTags[i]); i++) {
            if ((url = cssTag.getAttribute("href"))) {
                if (! /^https?:\/\/|^\//.test(url)) { // TODO: look into base links...
                    cssTag.href = rootUrl + url;
                    url = cssTag.href;
                }

                if (url in fromLinks) {
                    continue;
                }

                fromLinks[url] = true;
                this._expectedStylesLoadedCount++;
                // https://bugs.webkit.org/show_bug.cgi?id=38995
                // https://bugzilla.mozilla.org/show_bug.cgi?id=185236
                // http://www.backalleycoder.com/2011/03/20/link-tag-css-stylesheet-load-event/
                var style = doc.importNode(cssTag,false);
                style.href = url;
                container.insertBefore(style, container.firstChild);
                if (logger.isDebug) {
                    container.insertBefore(doc.createComment("Inserted from " + this._id), container.firstChild);
                }

                var loadHandler = function(event) {
                    if (++self._stylesLoadedCount === self._expectedStylesLoadedCount) {
                        var callback;
                        while((callback = callbacks.pop())) {
                            callback();
                        }
                        self._stylesLoadedCallbacks = callbacks = null;
                    }
                    this.removeEventListener(event.type,loadHandler,false);
                    if(event.type === "error") {
                        console.log("CSS file "+ url + " is missing");
                    }
                };

                var req = new XMLHttpRequest();
                req.open("GET", url);
                // Some old browsers still don't implement this
                //req.addEventListener("load",loadHandler,false);
                //req.addEventListener("error",loadHandler,false);
                req.onreadystatechange = (function(req) {
                    return function(event) {
                        if (req.readyState === 4) {
                            if (req.status === 200) {
                                loadHandler({type: "load"});
                            } else {
                                loadHandler({type: "error"});
                            }
                        }
                    }
                })(req);
                req.send();

            } else {
                container.insertBefore(doc.importNode(cssTag, true), container.firstChild);
                if (logger.isDebug) {
                    container.insertBefore(doc.createComment("Inserted from " + this._id), container.firstChild);
                }
            }
        }

        if (cssTagsCount > 1) {
            documentHead.insertBefore(container, documentHead.firstChild);
        }
    }},

    /**
     Inserts all scripts found in the Template object into the document given.
     This function is idempotent, it will not insert scripts that are already in the document.
     @function
     @param {HTMLDocument} doc The document to insert the scripts.
     */
    insertScriptsInDocumentIfNeeded: {value: function(doc) {
        var importedScripts = doc._montage_importedScripts,
            _rootUrl = this._rootUrl,
            rootUrl = _rootUrl || null;

        if (!rootUrl) {
            return;
        }

        if (!importedScripts) {
            importedScripts = doc._montage_importedScripts = {
                fromTemplate: {},
                external: {}
            };
            //Montage.defineProperty(doc, "_montage_importedScripts", {
            //    enumerable: false,
            //    writable: false,
            //    value: {}
            //});
        } else if (rootUrl in importedScripts.fromTemplate) {
            return;
        }

        importedScripts.fromTemplate[rootUrl] = true;

        var documentHead = doc.head,
            scriptTags = this._document.querySelectorAll('script'),
            container = doc.createDocumentFragment(),
            externalScriptsLoaded = importedScripts.external,
            scriptNode, type, src,
            script;

        for (var i = 0; (script = scriptTags[i]); i++) {
            type = script.type;

            if (type === this._SCRIPT_TYPE) {
                continue;
            }

            src = script.getAttribute("src");
            scriptNode = doc.importNode(script, true);
            if (src) {
                if (! /^https?:\/\/|^\//.test(src)) { // TODO: look into base links...
                    scriptNode.src = rootUrl + src;
                    // scriptNode.src = scriptNode.src is used to normalize the src attribute
                    src = (scriptNode.src = scriptNode.src);
                }
                if (src in externalScriptsLoaded) continue;
                externalScriptsLoaded[src] = true;
            }
            if (logger.isDebug) {
                container.appendChild(doc.createComment("Inserted from " + this._id));
            }
            container.appendChild(scriptNode);
        }

        documentHead.appendChild(container);
    }},

    /**
     <i>This function is meant to work with insertScriptsInDocumentIfNeeded, insertStylesInDocumentIfNeeded and exportHeaders</i>.
     This function informs the caller when the Template styles have been loaded into the document.
     @function
     @param {Function} callback The function to invoke when all linked CSS files have been loaded.
     */
    waitForStyles: {
        value: function(callback) {
            if (this._stylesLoadedCount === this._expectedStylesLoadedCount) {
                callback();
            } else {
                this._stylesLoadedCallbacks.push(callback);
            }
        }
    },

    /**
     Creates an HTMLDocument from an HTML string.
     @function
     @param {String} htmlString The HTML string.
     @returns {HTMLDocument} The HTMLDocument object created.
     */
    createHtmlDocumentFromString: {value: function(htmlString) {
        var htmlDocument = document.implementation.createHTMLDocument("");

        htmlDocument.documentElement.innerHTML = htmlString;

        if (!htmlDocument.body) {
            // No body was created possibly due to a webkit issue
            // https://bugs.webkit.org/show_bug.cgi?id=43953
            // we'll need to manually populate the created document

            htmlDocument = document.implementation.createHTMLDocument("");

            var range = htmlDocument.createRange(),
                head = htmlDocument.getElementsByTagName("head").item(0),
                body = htmlDocument.getElementsByTagName("body").item(0),
                headIndex,
                headClosingIndex,
                bodyIndex,
                bodyClosingIndex,
                bodyContent,
                bodyFragment;

            headIndex = htmlString.indexOf("<head>");
            if (headIndex > 0) {
                headClosingIndex = htmlString.indexOf("</head>");
                head.outerHTML = htmlString.substring(headIndex + 6, headClosingIndex);
            }

            bodyIndex = htmlString.indexOf("<body");
            if (bodyIndex > 0) {
                bodyClosingIndex = htmlString.indexOf("</body>");
                bodyContent = htmlString.substring(bodyIndex, bodyClosingIndex + 7);

                range.selectNode(body);
                bodyFragment= range.createContextualFragment(bodyContent);
                body.appendChild(bodyFragment);
            }
        }

        return htmlDocument;
    }},

    // indexed by module id
    /**
        @private
    */
    _documentCache: {
        enumerable: false,
        value: {}
    },

    /**
     Creates an HTMLDocument from an HTML file at the given module id.
     @function
     @param {Function} requireFunction TODO
     @param {String} moduleId The module id.
     @param {Function} callback The require function to load the template file.
     */
    createHtmlDocumentFromModuleId: {value: function(requireFunction, moduleId, callback) {
        var self = this,
            documentCacheKey = requireFunction.location + moduleId,
            exports = this._documentCache[documentCacheKey];

        self._id = requireFunction.location + "/" + moduleId;
        if (exports) {
            self._rootUrl = exports.directory;
            callback(self.createHtmlDocumentFromString(exports.content));
        } else {
            requireFunction.async(moduleId)
            .then(function(exports) {
                self._rootUrl = (self._documentCache[documentCacheKey] = exports).directory;
                callback(self.createHtmlDocumentFromString(exports.content));
            })
            .done();
        }
    }},

    /**
     Searches for an inline serialization in a document and returns it if found.
     @function
     @param {HTMLDocument} doc The document to search.
     @returns {String} The serialization string.
     */
    getInlineSerialization: {value: function(doc) {
        var script = doc.querySelector("script[type='" + this._SCRIPT_TYPE + "']");

        if (script) {
            return script.textContent;
        } else if (this._document.querySelector("script[type='" + this._OLD_SCRIPT_TYPE + "']")) {
            logger.error("Unsupported serialization found" + (this._rootUrl ? " on " + this._rootUrl : "") + ", please upgrade to the new one.");
        } else {
            return null;
        }
    }},

    /**
     Searches for an external serialization in a document and returns its content if found.
     @function
     @param {String} doc The document to search.
     @param {Function} callback The function that will be called when the external serialization is read, it receives the serialization string as a parameter.
     */
    getExternalSerialization: {value: function(doc, callback) {
        var link = doc.querySelector('link[rel="serialization"]');

        if (link) {
            var req = new XMLHttpRequest(),
                url = link.getAttribute("href"),
                rootUrl = this._rootUrl || "";

            if (! /^https?:\/\/|^\//.test(url)) {
                url = rootUrl + url;
            }

            req.open("GET", url);
            req.addEventListener("load", function() {
                if (req.status == 200) {
                    callback(req.responseText);
                } else {
                    if (logger.isError) {
                        logger.error("Unable to retrive " + url + ", code status: " + req.status);
                    }
                    callback(null);
                }
            }, false);
            req.addEventListener("error", function() {
                if (logger.isError) {
                    logger.error("Unable to retrive " + url);
                }
                callback(null);
            }, false);
            req.send();
        } else {
            callback(null);
        }
    }},

    /**
     Gets the configured Deserializer object ready to deserialize the Template serialization if any.
     @function
     @param {Function} callback The callback method.
     */
    getDeserializer: {value: function(callback) {
        if (this._deserializer !== null) {
            callback(this._deserializer);
        } else {
            var serialization = this.getInlineSerialization(this._document),
                self = this;

            if (serialization) {
                // no need to be always duplicating this on instantiation
                this._removeSerialization();
                callback(this._createDeserializer(serialization));
            } else {
                this.getExternalSerialization(this._document, function(serialization) {
                    if (serialization) {
                        self._removeSerialization();
                        callback(self._createDeserializer(serialization));
                    } else {
                        callback(self._deserializer = false);
                    }
                });
            }
        }
    }},

    /**
     @private
    */
    _createDeserializer: {value: function(serialization) {
        var rootUrl = this._rootUrl ? this._rootUrl : window.location.href;
        return this._deserializer = Deserializer.create().initWithStringAndRequire(this._ownerSerialization = serialization, this._require, rootUrl);
    }},

    /**
     Sets the content of the the template's serialization script block to a new serialization.
     @function
     @param {Property} serialization A serialized object graph.
     */
    setSerialization: {value: function(serialization) {
        var script = this._document.querySelector("script[type='" + this._SCRIPT_TYPE + "']");
        var doc = this._document;

        if (!script) {
            script = doc.createElement("script");
            script.setAttribute("type", this._SCRIPT_TYPE);
            script.textContent = this._ownerSerialization;
            doc.head.appendChild(script);
        }
        script.textContent = this._ownerSerialization = serialization;
    }},

    _removeSerialization: {
        value: function() {
            var script = this._document.querySelector("script[type='" + this._SCRIPT_TYPE + "']");

            if (script) {
                script.parentNode.removeChild(script);
            }
        }
    },

    /**
     Converts the reel's HTML document into text.
     @function
     @returns {String} The contents of the HTML document.
     */
    exportToString: {value: function() {
        var doc = this._document;
        if (!this.getInlineSerialization(doc)) {
            var script = doc.createElement("script");
            script.setAttribute("type", this._SCRIPT_TYPE);
            script.textContent = this._ownerSerialization;
            doc.head.appendChild(script);
        }

        return new XMLSerializer().serializeToString(this._document);
    }},

    /**
     @private
     */
    serializeProperties: {value: function(serializer) {
        serializer.set("owner", this._ownerSerialization);
        serializer.set("markup", this._document.body.innerHTML);
    }},

    /**
     @private
     */
    deserializeProperties: {value: function(deserializer) {
        var markup = deserializer.get("markup"),
            owner = deserializer.get("owner"),
            _extends = deserializer.get("extends");

        if (markup) {
            this._document = document.implementation.createHTMLDocument("");
            this._document.body.innerHTML = markup;
        }

        if (owner) {
            this._ownerSerialization = owner;
        }

        if (_extends) {
            this._extends = _extends;
        }
    }}
});
