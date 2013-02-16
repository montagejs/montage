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
/*global Element */
/**
	@module montage/ui/component
    @requires montage
    @requires montage/ui/template
    @requires montage/core/gate
    @requires montage/core/logger | component
    @requires montage/core/logger | drawing
    @requires montage/core/event/event-manager
 */
var Montage = require("montage").Montage,
    Template = require("ui/template").Template,
    Gate = require("core/gate").Gate,
    Promise = require("core/promise").Promise,
    logger = require("core/logger").logger("component"),
    drawLogger = require("core/logger").logger("drawing"),
    defaultEventManager = require("core/event/event-manager").defaultEventManager;

/**
    @requires montage/ui/component-description
 */
/**
 * @class module:montage/ui/component.Component
 * @classdesc Base class for all Montage components.
   @extends module:montage/core/core.Montage
 */
var Component = exports.Component = Montage.create(Montage,/** @lends module:montage/ui/component.Component# */ {
/**
        Description TODO
        @type {Property}
        @default null
    */
    delegate: {
        value: null
    },

    templateObjects: {
        serializable: false,
        value: null
    },

    parentProperty: {
        value: "parentComponent"
    },

    /**
      Dispatch the actionEvent this component is configured to emit upon interaction
      @private
    */
    _dispatchActionEvent: {
        value: function() {
            this.dispatchEvent(this.createActionEvent());
        },
        enumerable: false
    },

    /**
        Create a custom event to dispatch upon interaction
        @type {Function}
        @returns and event to dispatch upon interaction
    */
    createActionEvent: {
        value: function() {
            var actionEvent = document.createEvent("CustomEvent");
            actionEvent.initCustomEvent("action", true, true, null);
            return actionEvent;
        }
    },

/**
    Description TODO
    @function
    @returns this._canDrawGate
    */
    canDrawGate: {
        get: function() {
            if (!this._canDrawGate) {
                this._canDrawGate = Gate.create().initWithDelegate(this);
                this._canDrawGate.setField("componentTreeLoaded", false);
            }
            return this._canDrawGate;
        },
        enumerable: false
    },
/**
  Description TODO
  @private
*/
    _blockDrawGate: {
        value: null
    },
/**
    Description TODO
    @function
    @returns this._blockDrawGate
    */
    blockDrawGate: {
        enumerable: false,
        get: function() {
            if (!this._blockDrawGate) {
                this._blockDrawGate = Gate.create().initWithDelegate(this);
                this._blockDrawGate.setField("element", false);
                this._blockDrawGate.setField("drawRequested", false);
            }
            return this._blockDrawGate;
        }
    },

   /**
  Description TODO
  @private
*/ _firstDraw: {
        enumerable: false,
        value: true
    },
/**
  Description TODO
  @private
*/
    _completedFirstDraw: {
        enumerable: false,
        value: false
    },
/**
  Description TODO
  @private
*/
    _element: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    element: {
        get: function() {
            return this._element;
        },
        set: function(value) {
            if (value == null) {
                console.warn("Tried to set element of ", this, " to ", value);
                return;
            }

            if (this.isDeserializing) {
                this.eventManager.registerEventHandlerForElement(this, value);

                // if this component has a template and has been already instantiated then assume the value is the template.
                if (this._isTemplateInstantiated) {
                    // this is important for component extension, we don't want to override template element
                    if (!this._templateElement) {
                        this._templateElement = value;
                    }
                } else {
                    this._element = value;
                    if (!this.blockDrawGate.value && this._element) {
                        this.blockDrawGate.setField("element", true);
                    }
                }
            } else if (!this._firstDraw) {
                // If a draw has happened then at some point the element has been set
                console.error("Cannot change element of ", this, " after it has been set");
                return;
            } else {
                this.eventManager.registerEventHandlerForElement(this, value);

                this._element = value;
                if (!this.blockDrawGate.value && this._element) {
                    this.blockDrawGate.setField("element", true);
                }
            }
        }
    },

    setElementWithParentComponent: {
        value: function(element, parent) {
            this._alternateParentComponent = parent;
            if (this.element != element) {
                this.element = element;
            }
        }
    },

    // access to the Application object
/**
    Description TODO
    @function
    @returns document.application
    */
    application: {
        enumerable: false,
        get: function() {
            return document.application;
        }
    },
/**
    Description TODO
    @function
    @returns defaultEventManager
    */
    eventManager: {
        enumerable: false,
        get: function() {
            return defaultEventManager;
        }
    },
/**
    Description TODO
    @function
    @returns rootComponent
    */
    rootComponent: {
        enumerable: false,
        get: function() {
            return rootComponent;
        }
    },
/**
    Description TODO
    @function
    @returns {Boolean} false
    */
    acceptsDirectFocus: {
        enumerable: false,
        value: function() {
            return false;
        }
    },
/**
    Description TODO
    @function
    @returns targetElementController
    */
    elementControllerFromEvent: {
        enumerable: false,
        value: function(event, targetElementController) {
            return targetElementController;
        }
    },

    _alternateParentComponent: {
        value: null
    },

/**
  Description TODO
  @private
*/
    _cachedParentComponent: {
        value: null
    },
        // TODO store the value and delete it after draw
/**
    The parent component is found by walking up the DOM tree from the node returned by the <i>element</i> property.<br>
    If we find a parentNode that has a controller then we return this controller.<br>
    Returns undefined if this is the rootComponent.
    @function
    @returns undefined or cachedParentComponent
    */
    parentComponent: {
        enumerable: false,
        get: function() {
            var cachedParentComponent = this._cachedParentComponent;
            if (cachedParentComponent == null) {
                return (this._cachedParentComponent = this.findParentComponent());
            } else {
                return cachedParentComponent;
            }
        }
    },

    findParentComponent: {
        value: function() {
            var anElement = this.element,
                aParentNode,
                eventManager = this.eventManager;
            if (anElement) {
                while ((aParentNode = anElement.parentNode) != null && eventManager.eventHandlerForElement(aParentNode) == null) {
                    anElement = aParentNode;
                }
                return aParentNode ? eventManager.eventHandlerForElement(aParentNode) : this._alternateParentComponent;
            }
        }
    },

    querySelectorComponent: {
        value: function(selector) {
            if (typeof selector !== "string") {
                throw "querySelectorComponent: Selector needs to be a string.";
            }

            // \s*(?:@([^>\s]+)) leftHandOperand [<label>]
            // \s*(>)?\s* operator [>] (if undefined it's a space)
            // @([^>\s]+) rightHandOperand [<label>]
            // (.*) rest
            var matches = selector.match(/^\s*(?:@([^>\s]+))?(?:\s*(>)?\s*@([^>\s]+)(.*))?$/);
            if (!matches) {
                throw "querySelectorComponent: Syntax error \"" + selector + "\"";
            }

            var childComponents = this.childComponents,
                leftHandOperand = matches[1],
                operator = matches[2] || " ",
                rightHandOperand = matches[3],
                rest = matches[4],
                found;

            if (leftHandOperand) {
                rest = rightHandOperand ? "@"+rightHandOperand + rest : "";

                for (var i = 0, childComponent; (childComponent = childComponents[i]); i++) {
                    if (leftHandOperand === Montage.getInfoForObject(childComponent).label) {
                        if (rest) {
                            return childComponent.querySelectorComponent(rest);
                        } else {
                            return childComponent;
                        }
                    } else {
                        found = childComponent.querySelectorComponent(selector);
                        if (found) {
                            return found;
                        }
                    }
                }
            } else {
                for (var i = 0, childComponent; (childComponent = childComponents[i]); i++) {
                    if (rightHandOperand === Montage.getInfoForObject(childComponent).label) {
                        if (rest) {
                            return childComponent.querySelectorComponent(rest);
                        } else {
                            return childComponent;
                        }
                    }
                }
            }

            return null;
        }
    },

    querySelectorAllComponent: {
        value: function(selector, owner) {
            if (typeof selector !== "string") {
                throw "querySelectorComponent: Selector needs to be a string.";
            }

            // (@([^>\s]+)? leftHandOperand [<label>]
            // \s*(>)?\s* operator [>] (if undefined it's a space)
            // @([^>\s]+) rightHandOperand [<label>]
            // (.*) rest
            var matches = selector.match(/^\s*(?:@([^>\s]+))?(?:\s*(>)?\s*@([^>\s]+)(.*))?$/);
            if (!matches) {
                throw "querySelectorComponent: Syntax error \"" + selector + "\"";
            }

            var childComponents = this.childComponents,
                leftHandOperand = matches[1],
                operator = matches[2] || " ",
                rightHandOperand = matches[3],
                rest = matches[4],
                found = [];

            if (leftHandOperand) {
                rest = rightHandOperand ? "@"+rightHandOperand + rest : "";
                for (var i = 0, childComponent; (childComponent = childComponents[i]); i++) {
                    if (leftHandOperand === Montage.getInfoForObject(childComponent).label && (!owner || owner === childComponent.ownerComponent)) {
                        if (rest) {
                            found = found.concat(childComponent.querySelectorAllComponent(rest));
                        } else {
                            found.push(childComponent);
                        }
                    } else {
                        found = found.concat(childComponent.querySelectorAllComponent(selector, owner));
                    }
                }
            } else {
                for (var i = 0, childComponent; (childComponent = childComponents[i]); i++) {
                    if (rightHandOperand === Montage.getInfoForObject(childComponent).label && (!owner || owner === childComponent.ownerComponent)) {
                        if (rest) {
                            found = found.concat(childComponent.querySelectorAllComponent(rest, owner));
                        } else {
                            found.push(childComponent);
                        }
                    }
                }
            }

            return found;
        }
    },

/**
        Description TODO
        @type {Property}
        @default null
    */
    template: {
        enumerable: false,
        value: null
    },

/**
        Specifies whether the component has an HTML template file associated with it.
        @type {Property}
        @default {Boolean} true
*/
    hasTemplate: {
        enumerable: false,
        value: true
    },

/**
        Description TODO
        @type {Property}
        @default null
*/
    _templateModuleId: {
        serializable: false,
        value: null
    },

    _template: {
        value: null
    },

    // Tree level necessary for ordering drawing re: parent-child
    _treeLevel: {
        value: 0
    },
/**
    Description TODO
    @function
    @param {Component} childComponent The childComponent
    */
    _addChildComponent: {
        value: function(childComponent) {
            if (this.childComponents.indexOf(childComponent) == -1) {
                this.childComponents.push(childComponent);
                childComponent._cachedParentComponent = this;
            }
        }
    },
/**
    Description TODO
    @function
    */
    attachToParentComponent: {
        value: function() {
            this._cachedParentComponent = null;

            var parentComponent = this.parentComponent,
                childComponents,
                childComponent;

            if (parentComponent) {
                childComponents = parentComponent.childComponents;
                for (var i = 0; (childComponent = childComponents[i]); i++) {
                    var newParentComponent = childComponent.findParentComponent();
                    if (newParentComponent === this) {
                        parentComponent.removeChildComponent(childComponent);
                        newParentComponent._addChildComponent(childComponent);
                    }
                }

                parentComponent._addChildComponent(this);
            }
        }
    },

    detachFromParentComponent: {
        value: function() {
            var parentComponent = this.parentComponent;

            if (parentComponent) {
                parentComponent.removeChildComponent(this);
            }
        }
    },
/**
    Description TODO
    @function
    @param {Component} childComponent The childComponent
    */
    removeChildComponent: {
        value: function(childComponent) {
            var childComponents = this.childComponents,
                element = childComponent._element,
                ix = childComponents.indexOf(childComponent);

            if (ix > -1) {
                childComponents.splice(ix, 1);
                childComponent._cachedParentComponent = null;
                childComponent._alternateParentComponent = null;
            }
        }
    },
/**
        Description TODO
        @type {Property}
        @default {Array} []
    */
    childComponents: {
        enumerable: false,
        distinct: true,
        value: []
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    ownerComponent: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Property}
        @default {}
    */
    components: {
        enumerable: false,
        value: {}
    },
/**
  Description TODO
  @private
*/
    _isComponentExpanded: {
        enumerable: false,
        value: null
    },

    _isTemplateLoaded: {
        enumerable: false,
        value: null
    },

    _isTemplateInstantiated: {
        enumerable: false,
        value: null
    },

    /**
     * Remove all bindings and starts buffering the needsDraw.
     * @function
     */
    cleanupDeletedComponentTree: {
        value: function(deleteBindings) {
            // Deleting bindings in all cases was causing the symptoms expressed in gh-603
            // Until we have a more granular way we shouldn't do this,
            // the deleteBindings parameter is a short term fix.
            if (deleteBindings) {
                Object.deleteBindings(this);
            }
            this.needsDraw = false;
            this.traverseComponentTree(function(component) {
                // See above comment
                if (deleteBindings) {
                    Object.deleteBindings(component);
                }
                component.needsDraw = false;
            });
        }
    },

    originalContent: {
        serializable: false,
        value: null
    },

    _newDomContent: {
        enumerable: false,
        value: null
    },

    domContent: {
        serializable: false,
        get: function() {
            if (this._element) {
                return Array.prototype.slice.call(this._element.childNodes, 0);
            } else {
                return null;
            }
        },
        set: function(value) {
            var components,
                componentsToAdd = [];

            this._newDomContent = value;
            this.needsDraw = true;

            if (this._newDomContent === null) {
                this._shouldClearDomContentOnNextDraw = true;
            }

            if (typeof this.contentWillChange === "function") {
                this.contentWillChange(value);
            }

            // cleanup current content
            components = this.childComponents;
            for (var i = 0, component; (component = components[i]); i++) {
                component.detachFromParentComponent();
                component.cleanupDeletedComponentTree();
            }

            if (value instanceof Element) {
                findAndDetachComponents(value);
            } else if (value) {
                for (var i = 0; i < value.length; i++) {
                    findAndDetachComponents(value[i]);
                }
            }

            // find the component fringe and detach them from the component tree
            function findAndDetachComponents(node) {
                var component = node.controller;

                if (component) {
                    component.detachFromParentComponent();
                    componentsToAdd.push(component);
                } else {
                    var childNodes = node.childNodes;
                    for (var i = 0, childNode; (childNode = childNodes[i]); i++) {
                        findAndDetachComponents(childNode);
                    }
                }
            }

            // not sure if I can rely on _cachedParentComponent to detach the nodes instead of doing one loop for dettach and another to attach...
            for (var i = 0, component; (component = componentsToAdd[i]); i++) {
                this._addChildComponent(component);
            }
        }
    },

    _shouldClearDomContentOnNextDraw: {
        value: false
    },

    clonesChildComponents: {
        writable: false,
        value: false
    },

/**
    Description TODO
    @function
    */
    deserializedFromSerialization: {
        value: function() {
            this.attachToParentComponent();
            if (this._element) {
                // the DOM content of the component was dynamically modified
                // but it hasn't been drawn yet, we're going to assume that
                // this new DOM content is the desired original content for
                // this component since it has been set at deserialization
                // time.
                if (this._newDomContent) {
                    this.originalContent = this._newDomContent;
                } else {
                    this.originalContent = Array.prototype.slice.call(this._element.childNodes, 0);
                }
            }
            if (! this.hasOwnProperty("identifier")) {
                this.identifier = Montage.getInfoForObject(this).label;
            }
        }
    },

    serializeProperties: {
        value: function(serializer) {
            serializer.setAll();
            var childComponents = this.childComponents;
            for (var i = 0, l = childComponents.length; i < l; i++) {
                serializer.addObject(childComponents[i]);
            }
        }
    },

    /**
    This method is called right before draw is called.<br>
    If <code>canDraw()</code> returns false, then the component is re-added to the parent's draw list and draw isn't called.
    @function
    @returns {Boolean} true or false
    */
    canDraw: {
        value: function() {
            return this._canDraw;
        }
    },
/**
  Description TODO
  @private
*/
    _canDraw: {
        get: function() {
            return (!this._canDrawGate || this._canDrawGate.value);
        },
        set: function(value) {
            rootComponent.componentCanDraw(this, value);
        },
        enumerable: false
    },
/**
  Description TODO
  @private
*/
    _prepareCanDraw: {
        enumerable: false,
        value: function _prepareCanDraw() {
            if (!this._isComponentTreeLoaded) {
                this.loadComponentTree();
            }
        }
    },
/**
  Description TODO
  @private
*/
    _loadComponentTreeCallbacks: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _isComponentTreeLoaded: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _isComponentTreeLoading: {
        enumerable: false,
        value: null
    },
/**
    Description TODO
    @function
    @param {Object} callback Callback object
    @returns itself
    */
    loadComponentTree: {value: function loadComponentTree(callback) {
        var self = this,
            canDrawGate = this.canDrawGate;

        if (this._isComponentTreeLoaded) {
            if (callback) {
                callback(this);
            }
            return;
        }

        if (callback) {
            if (this._loadComponentTreeCallbacks == null) {
                this._loadComponentTreeCallbacks = [callback];
            } else {
                this._loadComponentTreeCallbacks.push(callback);
            }
        }
        if (this._isComponentTreeLoading) {
            return;
        }

        canDrawGate.setField("componentTreeLoaded", false);
        // only put it in the root component's draw list if the component has requested to be draw, it's possible to load the component tree without asking for a draw.
        // What about the hasTemplate check?
        if (this.needsDraw || this.hasTemplate) {
            this._canDraw = false;
        }

        function callCallbacks() {
            var callback, callbacks = self._loadComponentTreeCallbacks;

            self._isComponentTreeLoading = false;
            self._isComponentTreeLoaded = true;

            canDrawGate.setField("componentTreeLoaded", true);

            if (callbacks) {
                for (var i = 0; (callback = callbacks[i]); i++) {
                    callback(self);
                }
                self._loadComponentTreeCallbacks = callbacks = null;
            }
        }

        this._isComponentTreeLoading = true;
        this.expandComponent(function() {
            var childComponent,
                childComponents = self.childComponents,
                childComponentsCount = childComponents.length,
                childrenLoadedCount = 0,
                i;

            if (childComponentsCount === 0) {
                callCallbacks();
                return;
            }

            for (i = 0; (childComponent = childComponents[i]); i++) {
                childComponent.loadComponentTree(function() {
                    if (++childrenLoadedCount === childComponentsCount) {
                        callCallbacks();
                    }
                });
            }
        });
    }},
/**
    Description TODO
    @function
    @param {Property} visitor visitor
    @param {Object} callback callback object
    @returns itself
    */
    traverseComponentTree: {value: function traverseComponentTree(visitor, callback) {
        var self = this;

        function traverse() {
            var childComponents = self.childComponents;
            var childComponent;
            var childLeftCount;

            if (visitor) {
                // if the visitor returns false stop the traversal for this subtree
                if (visitor(self) === false) {
                    if (callback) {
                        callback();
                    }
                    return;
                }
            }

            if ((childLeftCount = childComponents.length) === 0) {
                if (callback) {
                    callback();
                }
                return;
            }

            for (var i = 0; (childComponent = childComponents[i]); i++) {
                childComponent.traverseComponentTree(visitor, function() {
                    if (--childLeftCount === 0 && callback) {
                        callback();
                    }
                });
            }
        }

        if (this._isComponentExpanded) {
            traverse();
        } else {
            this.expandComponent(function() {
                traverse();
            });
        }
    }},
/**
    Description TODO
    @function
    @param {Object} callback  TODO
    */
    expandComponent: {value: function expandComponent(callback) {
        var self = this;

        if (this.hasTemplate && !this._isTemplateInstantiated) {
            this.loadTemplate(function() {
                self._isComponentExpanded = true;
                if (callback) {
                    callback();
                }
            });
        } else {
            self._isComponentExpanded = true;
            if (callback) {
                callback();
            }
        }
    }},

/**
  Description TODO
  @private
*/
    _loadTemplateCallbacks: {
        enumerable: false,
        value: null
    },

/**
    Description TODO
    @function
    @param {Object} callback  TODO
*/
    loadTemplate: {value: function loadTemplate(callback) {
        var self = this;

        if (!this._isTemplateInstantiated) {
            this._loadTemplate(function(template) {
                var instances = self.templateObjects;

                if (instances) {
                    instances.owner = self;
                } else {
                    self.templateObjects = instances = {owner: self};
                }

                // this actually also serves as isTemplateInstantiating
                self._isTemplateInstantiated = true;
                template.instantiateWithInstancesAndDocument(instances, self._element.ownerDocument, function() {
                    if (callback) {
                        callback();
                    }
                });
            });
        }
    }},

    _loadTemplate: {value: function _loadTemplate(callback) {
        if (this._isTemplateLoaded) {
            if (callback) {
                callback(this._template);
            }
            return;
        }
        // TODO we can create _loadTemplateCallbacks with [] and use "distinct" after merging with master
        if (callback) {
            if (this._loadTemplateCallbacks === null) {
                this._loadTemplateCallbacks = [callback];
            } else {
                this._loadTemplateCallbacks.push(callback);
            }
        }
        if (this._isTemplateLoading) {
            return;
        }
        this._isTemplateLoading = true;
        var self = this;
        var info, moduleId;

        var onTemplateLoad = function(template) {
            var callbacks = self._loadTemplateCallbacks;
            self._template = template;
            self._isTemplateLoaded = true;
            self._isTemplateLoading = false;

            if (callbacks) {
                for (var i = 0; (callback = callbacks[i]); i++) {
                    callback(template);
                }
                self._loadTemplateCallbacks = callbacks = null;
            }
        };

        info = Montage.getInfoForObject(this);

        if (logger.isDebug) {
            logger.debug(this, "Will load " + this.templateModuleId);
        }
        // this call will be synchronous if the template is cached.
        Template.templateWithModuleId(info.require, this.templateModuleId, onTemplateLoad);
    }},

    templateModuleId: {
        get: function() {
            return this._templateModuleId || this._getDefaultTemplateModuleId();
        }
    },

    _getDefaultTemplateModuleId: {
        value: function() {
            var templateModuleId,
                slashIndex,
                moduleId,
                info;

            info = Montage.getInfoForObject(this);
            moduleId = info.moduleId;
            slashIndex = moduleId.lastIndexOf("/");
            templateModuleId = moduleId + "/" + moduleId.slice(slashIndex === -1 ? 0 : slashIndex+1, -5 /* ".reel".length */) + ".html";

            return templateModuleId;
        }
    },

    _deserializedFromTemplate: {
        value: function(owner) {
            if (!this.ownerComponent) {
                if (Component.isPrototypeOf(owner)) {
                    this.ownerComponent = owner;
                } else {
                    this.ownerComponent = this.rootComponent;
                }
            }
        }
    },

    blueprintModuleId: {
        serializable: false,
        enumerable: false,
        get: function () {
            var info = Montage.getInfoForObject(this);
            var self = (info && !info.isInstance) ? this : Object.getPrototypeOf(this);
            if ((!Object.getOwnPropertyDescriptor(self, "_blueprintModuleId")) || (!self._blueprintModuleId)) {
                info = Montage.getInfoForObject(self);
                var moduleId = info.moduleId,
                    slashIndex = moduleId.lastIndexOf("/"),
                    dotIndex = moduleId.lastIndexOf(".");
                slashIndex = ( slashIndex === -1 ? 0 : slashIndex + 1 );
                dotIndex = ( dotIndex === -1 ? moduleId.length : dotIndex );
                dotIndex = ( dotIndex < slashIndex ? moduleId.length : dotIndex );

                var blueprintModuleId;
                if ((dotIndex < moduleId.length) && ( moduleId.slice(dotIndex, moduleId.length) == ".reel")) {
                    // We are in a reel
                    blueprintModuleId = moduleId + "/" + moduleId.slice(slashIndex, dotIndex) + "-blueprint.json";
                } else {
                    // We look for the default
                    blueprintModuleId = moduleId.slice(0, dotIndex) + "-blueprint.json";
                }

                Montage.defineProperty(self, "_blueprintModuleId", {
                    value: blueprintModuleId
                });
            }
            return self._blueprintModuleId;
        }
    },

    blueprint: require("montage")._blueprintDescriptor,

    /**
    Callback for the <code>_canDrawGate</code>.<br>
    Propagates to the parent and adds the component to the draw list.
    @function
    @param {Property} gate
    @see _canDrawGate
    */
    gateDidBecomeTrue: {
        value: function(gate) {
            if (gate == this._canDrawGate) {
                this._canDraw = true;
            } else if (gate == this._blockDrawGate) {
                rootComponent.componentBlockDraw(this);
                this._prepareCanDraw();
            }
        },
        enumerable: false
    },

/**
    Gate that controls the _canDraw property. When it becomes true it sets _canDraw to true.
    @function
    @returns Gate
    @private
    */
    _canDrawGate: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _preparedForActivationEvents: {
        enumerable: false,
        value: false
    },

    /**
        If needsDraw property returns true this call adds the current component instance to the rootComponents draw list.<br>
        Then it iterates on every child component in the component's drawList.<br>
        On everyone of them it calls <code>canDraw()</code>.<br>
        If the result is true, <code>_drawIfNeeded()</code> is called, otherwise they are ignored.
        @private
     */
    _drawIfNeeded: {
        enumerable: false,
        value: function _drawIfNeeded(level) {
            var childComponent,
                oldDrawList, i, childComponentListLength;
            this._treeLevel = level;
            if (this.needsDraw && !this._addedToDrawCycle) {
                rootComponent.addToDrawCycle(this);
            }
            if (drawLogger.isDebug) {
                drawLogger.debug(this, "drawList: " + (this._drawList || []).length + " of " + this.childComponents.length);
            }
            if (this._drawList !== null && this._drawList.length > 0) {
                oldDrawList = this._drawList;
                this._drawList = [];
                childComponentListLength = oldDrawList.length;
                for (i = 0; i < childComponentListLength; i++) {
                    childComponent = oldDrawList[i];
                    if (drawLogger.isDebug) {
                        drawLogger.debug("Parent Component " + (this.element != null ? this.element.id : "") + " drawList length: " + oldDrawList.length);
                    }
                    childComponent._addedToDrawList = false;
                    if (drawLogger.isDebug) {
                        drawLogger.debug(this, "childComponent: " + childComponent.element + "; canDraw: " + childComponent.canDraw());
                    }
                    if (childComponent.canDraw()) { // TODO if canDraw is false when does needsDraw get reset?
                        childComponent._drawIfNeeded(level+1);
                    }
                }
            }
        }
    },

    _updateComponentDom: {
        value: function() {
            var component, composer, length, i;
            if (this._firstDraw) {

                if (this.parentComponent && typeof this.parentComponent.childComponentWillPrepareForDraw === "function") {
                    this.parentComponent.childComponentWillPrepareForDraw(this);
                }

                this._willPrepareForDraw();
                if (typeof this.willPrepareForDraw === "function") {
                    this.willPrepareForDraw();
                }

                this._prepareForDraw();

                if (this.prepareForDraw) {
                    this.prepareForDraw();
                }

                // Load any non lazyLoad composers that have been added
                length = this.composerList.length;
                for (i = 0; i < length; i++) {
                    composer = this.composerList[i];
                    if (!composer.lazyLoad) {
                        composer._load();
                    }
                }

                // Will we expose a different property, firstDraw, for components to check
                this._firstDraw = false;
            }

            if (this._newDomContent !== null || this._shouldClearDomContentOnNextDraw) {
                if (drawLogger.isDebug) {
                    logger.debug("Component content changed: component ", this._montage_metadata.objectName, this.identifier, " newDomContent", this._newDomContent);
                }
                this._performDomContentChanges();
            }
        }
    },

/**
  Description TODO
  @private
*/
    _replaceElementWithTemplate: {
        enumerable: false,
        value: function() {
            var element = this.element,
                template = this._templateElement,
                attributes = this.element.attributes,
                attributeName,
                value,
                i,
                attribute;

            // TODO: get a spec for this, what attributes should we merge?
            for (i = 0; (attribute = attributes[i]); i++) {
                attributeName = attribute.nodeName;
                if (attributeName === "id" || attributeName === "data-montage-id") {
                    value = attribute.nodeValue;
                } else {
                    value = (template.getAttribute(attributeName) || "") + (attributeName === "style" ? "; " : " ") +
                        attribute.nodeValue;
                }

                template.setAttribute(attributeName, value);
            }

            if (element.parentNode) {
                element.parentNode.replaceChild(template, element);
            } else {
                console.warn("Warning: Trying to replace element ", element," which has no parentNode");
            }

            this.eventManager.unregisterEventHandlerForElement(element);
            this.eventManager.registerEventHandlerForElement(this, template);
            this._element = template;
            this._templateElement = null;

            // if the DOM content of the component was changed before the
            // template has been drawn then we assume that this change is
            // meant to set the original content of the component and not to
            // replace the entire template with it, that wouldn't make much
            // sense.
            if (this._newDomContent) {
                this._newDomContent = null;
                this._shouldClearDomContentOnNextDraw = false;
            }
        }
    },

/**
  Description TODO
  @private
*/
    _prepareForDraw: {
        value: function _prepareForDraw() {
            if (logger.isDebug) {
                logger.debug(this, "_templateElement: " + this._templateElement);
            }
            if (this._templateElement) {
                this._replaceElementWithTemplate();
            }
            // This will schedule a second draw for any component that has children
            var childComponents = this.childComponents;
            for (var i = 0, childComponent; (childComponent = childComponents[i]); i++) {
                if (drawLogger.isDebug) {
                    drawLogger.debug(this, "needsDraw = true for: " + childComponent._montage_metadata.exportedSymbol);
                }
                childComponent.needsDraw = true;
            }
        },
        enumerable: false
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    prepareForActivationEvents: {
        enumerable: false,
        value: null
    },

    /**
     * Called to add event listeners on demand
     * @type function
     * @private
     */
    _prepareForActivationEvents: {
        value: function() {
            var i = this.composerList.length, composer;
            for (i = 0; i < this.composerList.length; i++) {
                composer = this.composerList[i];
                if (composer.lazyLoad) {
                    composer._load();
                }
            }
            if (typeof this.prepareForActivationEvents === "function") {
                this.prepareForActivationEvents();
            }
        }
    },

/**
  Description TODO
  @private
*/
    _performDomContentChanges: {
        value: function() {
            var contents = this._newDomContent,
                oldContent = this._element.childNodes[0],
                element;

            if (contents || this._shouldClearDomContentOnNextDraw) {
                element = this._element;

                element.innerHTML = "";

                if (contents instanceof Element) {
                    element.appendChild(contents);
                } else if(contents !== null) {
                    for (var i = 0, content; (content = contents[i]); i++) {
                        element.appendChild(content);
                    }
                }

                this._newDomContent = null;
                if (typeof this.contentDidChange === "function") {
                    this.contentDidChange(this._element.childNodes[0], oldContent);
                }
                this._shouldClearDomContentOnNextDraw = false;
            }
        }
    },
    /**
    This method is called so that the callee can insert or remove nodes from the DOMontage.
    @function
    */
    draw: {
        enumerable: false,
        value: function() {
        }
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    willDraw: {
        enumerable: false,
        value: null
    },

    /**
        This method is called once all the components that could draw in this loop have done so.
        @function
    */
    didDraw: {
        enumerable: false,
        value: function() {
        }
    },

    /**
       Records wether or not we have been added to the parent's drawList.
       @private
     */
    _addedToDrawList: {
        value: false
    },
/**
  Description TODO
  @private
*/
    _addToParentsDrawList: {
        enumerable: false,
        value: function() {
            if (!this._addedToDrawList) {
                var parentComponent = this.parentComponent;

                if (!parentComponent) {
                    if (drawLogger.isDebug) {
                        drawLogger.debug(this, "parentComponent is null");
                    }
                } else {
                    parentComponent._addToDrawList(this);
                }
                if (drawLogger.isDebug) {
                    drawLogger.debug("drawList -- childComponent",this._montage_metadata.objectName," added to ",parentComponent._montage_metadata.objectName);
                }
            }
        }
    },

    /**
       Backing property for needsDraw.
       @private
     */
    _needsDraw: {
        enumerable: false,
        value: false
    },

    /**
     The purpose of this property is to trigger the adding of the component to the draw list and maintain whether draw needs to be called as a consequence of drawIfNeeded.<br>
     If needsDraw is set to true, and the component can draw but is not yet added to the parent Draw List, then addToDrawList() is called on the parentComponent with this as the argument.<br>
     If the component cannot draw then it's recorded in the component's blockDrawGate that a draw was requested.<br>
     Two actions are required for a component to load:
     <ol>
        <li>it needs an element</li>
        <li>a draw must have been requested</li>
     </ol>
     @type {Function}
     @default {Boolean} false
     */
    needsDraw: {
        enumerable: false,
        get: function() {
            return !!this._needsDraw;
        },
        set: function(value) {
            if (this.isDeserializing) {
                // Ignore needsDraw(s) which happen during deserialization
                return;
            }
            if (this._needsDraw !== value) {
                if (drawLogger.isDebug) {
                    drawLogger.debug("NEEDS DRAW TOGGLED " + value + " FOR " + this._montage_metadata.objectName);
                }
                this._needsDraw = !!value;
                if (value) {
                    if (this.canDrawGate.value) {
                        this._addToParentsDrawList();
                    } else {
                        this.blockDrawGate.setField("drawRequested", true);
                    }
                } else {

                }
            }
        }
    },

    /**
     Contains the list of childComponents this instance is reponsible for drawing.
     @private
     */
    _drawList: {
        value: null
    },
/**
  Description TODO
  @private
*/
    __addToDrawList: {
        enumerable: false,
        value: function(childComponent) {
            if (this._drawList === null) {
                this._drawList = [childComponent];
                childComponent._addedToDrawList = true;
            } else {
                if (this._drawList.indexOf(childComponent) === -1) {
                    this._drawList.push(childComponent);
                    childComponent._addedToDrawList = true;
                }
            }
        }
    },

    /**
     Adds the passed in child component to the drawList<br>
     If the current instance isn't added to the drawList of its parentComponent, then it adds itself.
     @private
     */
    _addToDrawList: {
        enumerable: false,
        value: function(childComponent) {
            this.__addToDrawList(childComponent);
            this._addToParentsDrawList();
        }
    },

    _templateElement: {
        enumerable: false,
        value: null
    },

    // Pointer Claiming

    /**
        Ask this component to surrender the specified pointer to the demandingComponent.<br>
        The component can decide whether or not it should do this given the pointer and demandingComponent involved.<br>
        Some components may decide not to surrender control ever, while others may do so in certain situations.<br>
        Returns true if the pointer was surrendered, false otherwise.<br>
        The demandingComponent is responsible for claiming the surrendered pointer if it desires.
        @function
        @param {Property} pointer The pointerIdentifier that the demanding component is asking this component to surrender
        @param {Object} demandingComponent The component that is asking this component to surrender the specified pointer
        @returns {Boolean} true
     */
    surrenderPointer: {
        value: function(pointer, demandingComponent) {
            return true;
        }
    },

    // Composers
    /*
        Variable to track this component's associated composers
        @private
     */
    composerList: {
        value: [],
        distinct: true,
        serializable: false
    },

    /**
        Adds the passed in composer to the component's composer list.
        @function
        @param {Composer} composer Composer object
    */
    addComposer: {  // What if the same composer instance is added to more than one component?
        value: function(composer) {
            this.addComposerForElement(composer, composer.element);
        }
    },

    /**
        Adds the passed in composer to the component's composer list and
        sets the element of the composer to the passed in element.
        @function
        @param {Composer} composer Composer object
        @param {Element} element Element
    */
    addComposerForElement: {
        value: function(composer, element) {
            composer.component = this;
            composer.element = element;
            this.composerList.push(composer);

            if (!this._firstDraw) {  // prepareForDraw has already happened so do the loading here
                if (!composer.lazyLoad) {
                    composer._load();
                } else if (this._preparedForActivationEvents) { // even though it's lazyLoad prepareForActivationEvents has already happened
                    composer._load();
                }
            }
        }
    },

    /**
        Adds the passed in composer to the list of composers which will have their
        frame method called during the next draw cycle.  It causes a draw cycle to be scheduled
        iff one has not already been scheduled.
        @function
        @param {Composer} composer Composer object
    */
    scheduleComposer: {
        value: function(composer) {
            this.rootComponent.addToComposerList(composer);
        }
    },

    /**
        Removes the passed in composer from this component's composer list.  It takes care
        of calling the composers unload method before removing it from the list.
        @function
        @param {Composer} composer Composer object
    */
    removeComposer: {
        value: function(composer) {
            var i, length;
            length = this.composerList.length;
            for (i = 0; i < length; i++) {
                if (this.composerList[i].uuid === composer.uuid) {
                    this.composerList[i].unload();
                    this.composerList.splice(i, 1);
                    break;
                }
            }
        }
    },

    /**
        A convenience method for removing all composers from a component.  This method
        is responsible for calling unload on each composer before removing it.
        @function
    */
    clearAllComposers: {
        value: function() {
            var i, length, composerList = this.composerList;
            length = composerList.length;
            for (i = 0; i < length; i++) {
                composerList[i].unload();
            }
            composerList.splice(0, length);
        }
    },

    /**
        The localizer for this component
        @type {module:montage/core/localizer.Localizer}
        @default null
    */
    localizer: {
        value: null
    },

    _waitForLocalizerMessages: {
        value: false
    },
    /**
        Whether to wait for the localizer to load messages before drawing.
        Make sure to set the localizer before setting to <code>true</code>.
        @type Boolean
        @default false
        @example
    // require localizer
    var defaultLocalizer = localizer.defaultLocalizer,
        _ = defaultLocalizer.localizeSync.bind(defaultLocalizer);

    exports.Main = Montage.create(Component, {

        didCreate: {
            value: function() {
                this.localizer = defaultLocalizer;
                this.waitForLocalizerMessages = true;
            }
        },

        // ...

        // no draw happens until the localizer's messages have been loaded
        prepareForDraw: {
            value: function() {
                this._greeting = _("hello", "Hello {name}!");
            }
        },
        draw: {
            value: function() {
                // this is for illustration only. This example is simple enough that
                // you should use a localizations binding
                this._element.textContent = this._greeting({name: this.name});
            }
        }
    }
    */
    waitForLocalizerMessages: {
        enumerable: false,
        get: function() {
            return this._waitForLocalizerMessages;
        },
        set: function(value) {
            if (this._waitForLocalizerMessages !== value) {
                if (value === true && !this.localizer.messages) {
                    if (!this.localizer) {
                        throw "Cannot wait for messages on localizer if it is not set";
                    }

                    this._waitForLocalizerMessages = true;

                    var self = this;
                    logger.debug(this, "waiting for messages from localizer");
                    this.canDrawGate.setField("messages", false);

                    this.localizer.messagesPromise.then(function(messages) {
                        if (logger.isDebug) {
                            logger.debug(self, "got messages from localizer");
                        }
                        self.canDrawGate.setField("messages", true);
                    });
                } else {
                    this._waitForLocalizerMessages = false;
                    this.canDrawGate.setField("messages", true);
                }
            }
        }
    },

    //
    // Attribute Handling
    //

    /**
        Stores values that need to be set on the element. Cleared each draw cycle.
        @private
     */
    _elementAttributeValues: {
        value: null
    },

    /**
        Stores the descriptors of the properties that can be set on this control
        @private
     */
    _elementAttributeDescriptors: {
       value: null
    },


    _getElementAttributeDescriptor: {
        value: function(attributeName) {
            var attributeDescriptor, instance = this;
            // walk up the prototype chain from the instance to NativeControl's prototype
            // if _elementAttributeDescriptors is falsy, stop.
            while(instance && instance._elementAttributeDescriptors) {
                attributeDescriptor = instance._elementAttributeDescriptors[attributeName];
                if(attributeDescriptor) {
                    break;
                } else {
                    instance = Object.getPrototypeOf(instance);
                }
            }
            return attributeDescriptor;
        }
    },

    /**
    * Adds a property to the component with the specified name. This method is used internally by the framework convert a DOM element's standard attributes into bindable properties. It creates an accessor property (getter/setter) with the same name as the specified property, as well as a "backing" data property whose name is prepended with an underscore (_). The backing variable is assigned the value from the property descriptor. For example, if the name  "title" is passed as the first parameter, a "title" accessor property is created as well a data property named "_title".
    * @function
    * @param {String} name The property name to add.
    * @param {Object} descriptor An object that specifies the new properties default attributes such as configurable and enumerable.
    */
    defineAttribute: {
        value: function(name, descriptor) {
            descriptor = descriptor || {};
            var _name = '_' + name;


            var newDescriptor = {
                configurable: (typeof descriptor.configurable == 'undefined') ? true: descriptor.configurable,
                enumerable: (typeof descriptor.enumerable == 'undefined') ?  true: descriptor.enumerable,
                set: (function(name, attributeName) {
                    return function(value) {
                        var descriptor = this._getElementAttributeDescriptor(name, this);

                        // if requested dataType is boolean (eg: checked, readonly etc)
                        // coerce the value to boolean
                        if(descriptor && "boolean" === descriptor.dataType) {
                            value = ( (value || value === "") ? true : false);
                        }

                        // If the set value is different to the current one,
                        // update it here, and set it to be updated on the
                        // element in the next draw cycle.
                        if((typeof value !== 'undefined') && this[attributeName] !== value) {
                            this[attributeName] = value;
                            // at this point we know that we will need it so create it once.
                            if(this._elementAttributeValues === null) {
                                this._elementAttributeValues = {};
                            }
                            this._elementAttributeValues[name] = value;
                            this.needsDraw = true;
                        }
                    };
                }(name, _name)),
                get: (function(name, attributeName) {
                    return function() {
                        return this[attributeName];
                    };
                }(name, _name))
            };

            // Define _ property
            Montage.defineProperty(this, _name, {value: null});
            // Define property getter and setter
            Montage.defineProperty(this, name, newDescriptor);
        }
    },

    /**
    * Add the specified properties as properties of this component.
    * @function
    * @param {object} properties An object that contains the properties you want to add.
    */
    addAttributes: {
        value: function(properties) {
            var i, descriptor, property, object;
            this._elementAttributeDescriptors = properties;

            for(property in properties) {
                if(properties.hasOwnProperty(property)) {
                    object = properties[property];
                    // Make sure that the descriptor is of the correct form.
                    if(object === null || String.isString(object)) {
                        descriptor = {value: object, dataType: "string"};
                        properties[property] = descriptor;
                    } else {
                        descriptor = object;
                    }

                    // Only add the internal property, and getter and setter if
                    // they don't already exist.
                    if(typeof this[property] === 'undefined') {
                        this.defineAttribute(property, descriptor);
                    }
                }
            }
        }
    },

// callbacks

    _willPrepareForDraw: {
        value: function() {
            // The element is now ready, so we can read the attributes that
            // have been set on it.
            var attributes, i, length, name, value, attributeName, descriptor;
            attributes = this.element.attributes;
            if (attributes) {
                length = attributes.length
                for(i=0; i < length; i++) {
                    name = attributes[i].name;
                    value = attributes[i].value;

                    descriptor = this._getElementAttributeDescriptor(name, this);
                    // check if this attribute from the markup is a well-defined attribute of the component
                    if(descriptor || (typeof this[name] !== 'undefined')) {
                        // at this point we know that we will need it so create it.
                        if(this._elementAttributeValues === null) {
                            this._elementAttributeValues = {};
                        }
                        // only set the value if a value has not already been set by binding
                        if(typeof this._elementAttributeValues[name] === 'undefined') {
                            this._elementAttributeValues[name] = value;
                            if( (typeof this[name] == 'undefined') || this[name] == null) {
                                this[name] = value;
                            }
                        }
                    }
                }
            }

            // textContent is a special case since it isn't an attribute
            descriptor = this._getElementAttributeDescriptor('textContent', this);
            if(descriptor) {
                // check if this element has textContent
                var textContent = this.element.textContent;
                if(typeof this._elementAttributeValues.textContent === 'undefined') {
                    this._elementAttributeValues.textContent = textContent;
                    if( this.textContent == null) {
                        this.textContent = textContent;
                    }
                }
            }

            // Set defaults for any properties that weren't serialised or set
            // as attributes on the element.
            if (this._elementAttributeDescriptors) {
                for (attributeName in this._elementAttributeDescriptors) {
                    descriptor = this._elementAttributeDescriptors[attributeName];
                    var _name = "_"+attributeName;
                    if (this[_name] === null && descriptor !== null && "value" in descriptor) {
                        this[_name] = this._elementAttributeDescriptors[attributeName].value;
                    }
                }
            }

        }
    },

    _draw: {
        value: function() {
            var element = this.element, descriptor;

            for(var attributeName in this._elementAttributeValues) {
                if(this._elementAttributeValues.hasOwnProperty(attributeName)) {
                    var value = this[attributeName];
                    descriptor = this._getElementAttributeDescriptor(attributeName, this);
                    if(descriptor) {

                        if(descriptor.dataType === 'boolean') {
                            if(value === true) {
                                element[attributeName] = true;
                                element.setAttribute(attributeName, attributeName.toLowerCase());
                            } else {
                                element[attributeName] = false;
                                element.removeAttribute(attributeName);
                            }
                        } else {
                            if(typeof value !== 'undefined') {
                                if(attributeName === 'textContent') {
                                    element.textContent = value;
                                } else {
                                    //https://developer.mozilla.org/en/DOM/element.setAttribute
                                    element.setAttribute(attributeName, value);
                                }

                            }
                        }

                    }

                    delete this._elementAttributeValues[attributeName];
                }
            }
        }
    }
});



/* @extends montage/ui/component.Component */
/**
 * @class module:montage/ui/component.RootComponent
 * @classdesc RootComponent class is a subclass of {@link Component}
 */
var rootComponent = Montage.create(Component, /** @lends module:montage/ui/component.RootComponent# */{
/**
    Description TODO
    @function
    @returns itself
    */
    init: {
        value: function() {
            return this;
        }
    },

    needsDraw: {
        enumerable: true,
        get: function() {
            return false;
        },
        set: function(value) {
            if (this._needsDraw !== value) {
                this._needsDraw = !!value;
                if (value) {
                    var childComponents = this.childComponents;
                    for (var i = 0, childComponent; (childComponent = childComponents[i]); i++) {
                        if (drawLogger.isDebug) {
                            drawLogger.debug(this, "needsDraw = true for: " + childComponent._montage_metadata.exportedSymbol);
                        }
                        childComponent.needsDraw = true;
                    }
                }
            }
        }
    },

    canDrawGate: {
        get: function() {
            return this._canDrawGate || (this._canDrawGate = Gate.create().initWithDelegate(this));
        }
    },
/**
  Description TODO
  @private
*/
    _clearNeedsDrawTimeOut: {
        value: null
    },
/**
  Description TODO
  @private
*/
    _needsDrawList: {
        value: []
    },
/**
  Description TODO
  @private
*/
    _cannotDrawList: {
        value: null
    },
/**
    Description TODO
    @function
    @param {Object} component Component object
    */
    componentBlockDraw: {
        value: function(component) {
            this._cannotDrawList = (this._cannotDrawList ? this._cannotDrawList : {});
            this._cannotDrawList[component.uuid] = component;
            if (this._clearNeedsDrawTimeOut) {
                window.clearTimeout(this._clearNeedsDrawTimeOut);
                this._clearNeedsDrawTimeOut = null;
            }
        }
    },

/**
    Description TODO
    @function
    @param {Object} component Component object
    @param {Number} value Component value
*/
    componentCanDraw: {
        value: function(component, value) {
            if (value) {
                delete this._cannotDrawList[component.uuid];
                this._needsDrawList.push(component);
                if (Object.keys(this._cannotDrawList).length === 0 && this._needsDrawList.length > 0) {
                    if (!this._clearNeedsDrawTimeOut) {
                        var self = this;
                        // Wait to clear the needsDraw list as components could be loaded synchronously
                        this._clearNeedsDrawTimeOut = window.setTimeout(function() {
                            self._clearNeedsDrawList();
                        }, 0);
                    }
                }
            } else {
                if (this._clearNeedsDrawTimeOut) {
                    window.clearTimeout(this._clearNeedsDrawTimeOut);
                    this._clearNeedsDrawTimeOut = null;
                }
            }
        }
    },
/**
  Description TODO
  @private
*/
    _clearNeedsDrawList: {
        value: function() {
            var component, i, length, needsDrawList = this._needsDrawList;
            length = needsDrawList.length;
            for (i = 0; i < length; i++) {
                component = needsDrawList[i];
                if (component.needsDraw) {
                    component._addToParentsDrawList();
                }
            }
            this._clearNeedsDrawTimeOut = null;
            needsDrawList.splice(0, length);
        }
    },
/**
    Description TODO
    @function
    @param {Component} componentId The component ID
    */
    removeFromCannotDrawList: {
        value: function(componentId) {
            delete this._cannotDrawList[componentId];
            if (Object.keys(this._cannotDrawList).length === 0 && this._needsDrawList.length > 0) {
                if (!this._clearNeedsDrawTimeOut) {
                    var self = this;
                    this._clearNeedsDrawTimeOut = window.setTimeout(function() {
                        self._clearNeedsDrawList();
                    }, 0);
                }
            }
        }
    },

    _cancelDrawIfScheduled: {
        value: function() {
            var requestedAnimationFrame = this.requestedAnimationFrame,
                cancelAnimationFrame = this.cancelAnimationFrame;
            if (requestedAnimationFrame !== null) {
                if (!this._frameTime) { // Only cancel it is not already in a drawTree call
                    if (logger.isDebug) {
                        logger.debug(this, "clearing draw");
                    }
                    if (cancelAnimationFrame) {
                        cancelAnimationFrame.call(window, requestedAnimationFrame);
                    } else {
                        window.clearTimeout(requestedAnimationFrame);
                    }
                    this.requestedAnimationFrame = null;
                }
            }
        }
    },

    /**
        Adds the passed in child component to the drawList.
        @private
     */
    _addToDrawList: {
        value: function(childComponent) {
            this.__addToDrawList(childComponent);
            if (drawLogger.isDebug) {
                drawLogger.debug(this, this.canDrawGate.value, this.requestedAnimationFrame);
            }
            this.drawTree();
        },
        enumerable: false
    },

    /**
     * Adds the passed in composer to the list of composers to be executed
     * in the next draw cycle and requests a draw cycle iff one has not been
     * requested yet.
     * @private
     * @function
     * @param {Composer} composer Composer object
     */
    addToComposerList: {
        value: function(composer) {
            this.composerList.push(composer);
            if (drawLogger.isDebug) {
                drawLogger.debug(this, composer, "Added to composer list");
            }
            // If a draw is already in progress this.drawTree() will not schedule another one, so track
            // that a composer requested a draw in case a new draw does need to be scheduled when the
            // current loop is done
            this._scheduleComposerRequest = true;
            this.drawTree();
        }
    },

    // Create a second composer list so that the lists can be swapped during a draw instead of creating a new array every time
    composerListSwap: {
        value: [],
        distinct: true
    },

    /*
        Flag to track if a composer is requesting a draw
        @private
     */
    _scheduleComposerRequest: {
        value: false
    },

    /**
        The value returned by requestAnimationFrame.<br>
        If a request has been scheduled but not run yet, else null.
        @type {Property}
        @default null
    */
    requestedAnimationFrame: {
        value: null,
        enumerable: false
    },
/**
        Description TODO
        @type {Property}
        @default (window.webkitRequestAnimationFrame ? window.webkitRequestAnimationFrame : window.mozRequestAnimationFrame)
    */
    requestAnimationFrame: {
        value: (window.webkitRequestAnimationFrame ? window.webkitRequestAnimationFrame : window.mozRequestAnimationFrame),
        enumerable: false
    },

/**
        Description TODO
        @type {Property}
        @default (window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame : window.mozCancelRequestAnimationFrame)
    */
    cancelAnimationFrame: {
        value: (window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame : window.mozCancelRequestAnimationFrame),
        enumerable: false
    },

    /**
        Set to the current time of the frame while drawing is in progress.<br>
        The frame time is either supplied by the requestAnimationFrame callback if available in the browser, or by using Date.now if it is a setTimeout.
        @private
     */
    _frameTime: {
        value: null
    },

    // oldSource and diff are used to detect DOM modifications outside of the
    // draw loop, but only if drawLogger.isDebug is true.
    _oldSource: {
        value: null
    },
    _diff: {
        // Written by John Resig. Used under the Creative Commons Attribution 2.5 License.
        // http://ejohn.org/projects/javascript-diff-algorithm/
        value: function( o, n ) {
            var ns = {};
            var os = {};

            for ( var i = 0; i < n.length; i++ ) {
              if ( ns[ n[i] ] == null )
                ns[ n[i] ] = { rows: [], o: null };
              ns[ n[i] ].rows.push( i );
            }

            for (i = 0; i < o.length; i++ ) {
              if ( os[ o[i] ] == null )
                os[ o[i] ] = { rows: [], n: null };
              os[ o[i] ].rows.push( i );
            }

            for (i in ns ) {
              if ( ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1 ) {
                n[ ns[i].rows[0] ] = { text: n[ ns[i].rows[0] ], row: os[i].rows[0] };
                o[ os[i].rows[0] ] = { text: o[ os[i].rows[0] ], row: ns[i].rows[0] };
              }
            }

            for (i = 0; i < n.length - 1; i++ ) {
              if ( n[i].text != null && n[i+1].text == null && n[i].row + 1 < o.length && o[ n[i].row + 1 ].text == null &&
                   n[i+1] == o[ n[i].row + 1 ] ) {
                n[i+1] = { text: n[i+1], row: n[i].row + 1 };
                o[n[i].row+1] = { text: o[n[i].row+1], row: i + 1 };
              }
            }

            for (i = n.length - 1; i > 0; i-- ) {
              if ( n[i].text != null && n[i-1].text == null && n[i].row > 0 && o[ n[i].row - 1 ].text == null &&
                   n[i-1] == o[ n[i].row - 1 ] ) {
                n[i-1] = { text: n[i-1], row: n[i].row - 1 };
                o[n[i].row-1] = { text: o[n[i].row-1], row: i - 1 };
              }
            }

            return { o: o, n: n };
        }
    },

/**
    Description TODO
    @function
    */
    _previousDrawDate: {
        enumerable: false,
        value: 0
    },

    drawTree: {
        value: function drawTree() {
            if (this.requestedAnimationFrame === null) { // 0 is a valid requestedAnimationFrame value
                if (drawLogger.isDebug) {
                    drawLogger.debug(this, "requesting a draw");
                }
                var self = this, requestAnimationFrame = this.requestAnimationFrame;
                var _drawTree = function(timestamp) {
                    self._frameTime = (timestamp ? timestamp : Date.now());
                    if (self._clearNeedsDrawTimeOut) {
                        self._clearNeedsDrawList();
                    }
                    if (drawLogger.isDebug) {
                        // Detect any DOM modification since the previous draw
                        var newSource = document.documentElement.innerHTML;
                        if (self._oldSource && newSource !== self._oldSource) {
                            var warning = ["DOM modified outside of the draw loop"];
                            var out = self._diff(self._oldSource.split("\n"), newSource.split("\n"));
                            for (var i = 0; i < out.n.length; i++) {
                                // == null ok. Is also checking for undefined
                                if (out.n[i].text == null) {
                                    warning.push('+ ' + out.n[i]);
                                } else {
                                    // == null ok. Is also checking for undefined
                                    for (var n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++) {
                                        warning.push('- ' + out.o[n]);
                                    }
                                }
                            }
                            console.warn(warning.join("\n"));
                        }

                        console.group((timestamp ? drawLogger.toTimeString(new Date(timestamp)) + " " : "") + "Draw Fired");
                    }

                    self.drawIfNeeded();

                    if (drawLogger.isDebug) {
                        console.groupEnd();
                        self._oldSource = document.documentElement.innerHTML;
                    }
                    self._frameTime = null;
                    if (self._scheduleComposerRequest) {
                        self.drawTree();
                    }
                };
                if (requestAnimationFrame) {
                    this.requestedAnimationFrame = requestAnimationFrame.call(window, _drawTree);
                } else {
                    // Shim based in Erik Möller's code at
                    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
                    var currentDate = Date.now(),
                        miliseconds = 17 - currentDate + this._previousDrawDate;

                    if (miliseconds < 0) {
                        miliseconds = 0;
                    }
                    this.requestedAnimationFrame = setTimeout(_drawTree, miliseconds);
                    this._previousDrawDate = currentDate + miliseconds;
                }
                this._scheduleComposerRequest = false;
            }
        },
        enumerable: false
    },
/**
  Description TODO
  @private
*/
    _readyToDrawList: {
        enumerable: false,
        value: []
    },
/**
  Description TODO
  @private
*/
    _readyToDrawListIndex: {
        enumerable: false,
        value: null
    },
/**
    Description TODO
    @function
    @param {Component} component Component to add
    @returns itself
    */
    addToDrawCycle: {
        value: function(component) {
            var needsDrawListIndex = this._readyToDrawListIndex, length, composer;

            if (needsDrawListIndex.hasOwnProperty(component.uuid)) {
                // Requesting a draw of a component that has already been drawn in the current cycle
                if (drawLogger.isDebug) {
                    drawLogger.debug("components should not be added to the draw cycle twice");
                }
                return;
            }
            this._readyToDrawList.push(component);
            this._readyToDrawListIndex[component.uuid] = true;

            component._updateComponentDom();
        }
    },


    /**
        @function
        @returns !!needsDrawList.length
    */
    drawIfNeeded:{
        value: function drawIfNeeded() {
            var needsDrawList = this._readyToDrawList, component, i, j, start = 0, firstDrawEvent,
                composerList = this.composerList, composer, composerListLength;
            needsDrawList.length = 0;
            composerListLength = composerList.length;
            this._readyToDrawListIndex = {};

            // Process the composers first so that any components that need to be newly drawn due to composer changes
            // get added in this cycle
            if (composerListLength > 0) {
                this.composerList = this.composerListSwap; // Swap between two arrays instead of creating a new array each draw cycle
                for (i = 0; i < composerListLength; i++) {
                    composer = composerList[i];
                    composer.needsFrame = false;
                    composer.frame(this._frameTime);
                }
                composerList.splice(0, composerListLength);
                this.composerListSwap = composerList;
            }

            this._drawIfNeeded(0);
            j = needsDrawList.length;

            while (start < j) {
                for (i = start; i < j; i++) {
                    component = needsDrawList[i];
                    if (typeof component.willDraw === "function") {
                        component.willDraw(this._frameTime);
                    }
                    if (drawLogger.isDebug) {
                        drawLogger.debug(component._montage_metadata.objectName, " willDraw treeLevel ",component._treeLevel);
                    }
                }
                this._drawIfNeeded(0);
                start = j;
                j = needsDrawList.length;
            }

            // Sort the needsDraw list so that any newly added items are drawn in the correct order re: parent-child
            var sortByLevel = function(component1, component2) {
                return component1._treeLevel - component2._treeLevel;
            }
            needsDrawList.sort(sortByLevel);

            for (i = 0; i < j; i++) {
                component = needsDrawList[i];
                component.needsDraw = false;
            }
            this.requestedAnimationFrame = null; // Allow a needsDraw called during a draw to schedule the next draw
            // TODO: add the possibility to display = "none" the body during development (IKXARIA-3631).
            for (i = j-1; i >= 0; i--) {
                component = needsDrawList[i];
                component._draw(this._frameTime);
                component.draw(this._frameTime);
                if (drawLogger.isDebug) {
                    drawLogger.debug(component._montage_metadata.objectName, " draw treeLevel ",component._treeLevel);
                }
            }

            for (i = 0; i < j; i++) {
                component = needsDrawList[i];
                component.didDraw(this._frameTime);
                if (!component._completedFirstDraw) {
                    firstDrawEvent = document.createEvent("CustomEvent");
                    firstDrawEvent.initCustomEvent("firstDraw", true, false, null);
                    component.dispatchEvent(firstDrawEvent);
                    component._completedFirstDraw = true;
                }
                if (drawLogger.isDebug) {
                    drawLogger.debug(component._montage_metadata.objectName, " didDraw treeLevel ",component._treeLevel);
                }
            }
            return !!needsDrawList.length;
        }
    },
/**
        Description TODO
        @type {Function}
        @default element
    */
    element: {
        get:function() {
            return this._element;
        },
        set:function(value) {
            defaultEventManager.registerEventHandlerForElement(this, value);
            this._element = value;
        }
    }
});

rootComponent.init();
//if(window.parent && window.parent.jasmine) {
exports.__root__ = rootComponent;
//}
