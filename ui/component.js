/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module montage/ui/component
    @requires montage/core/core
    @requires montage/ui/reel
    @requires montage/core/gate
    @requires montage/core/logger | component
    @requires montage/core/logger | drawing
    @requires montage/core/event/event-manager
*/
var Montage = require("montage").Montage,
    Template = require("ui/template").Template,
    Gate = require("core/gate").Gate,
    logger = require("core/logger").logger("component"),
    drawLogger = require("core/logger").logger("drawing"),
    defaultEventManager = require("core/event/event-manager").defaultEventManager;
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
        enumerable: false,
        value: null
    },

    parentProperty: {
        serializable: true,
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
        }
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
        serializable: true,
        enumerable: true,
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
                while ((aParentNode = anElement.parentNode) !== null && eventManager.eventHandlerForElement(aParentNode) == null) {
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
        value: function(selector) {
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
                    if (leftHandOperand === Montage.getInfoForObject(childComponent).label) {
                        if (rest) {
                            found = found.concat(childComponent.querySelectorAllComponent(rest));
                        } else {
                            found.push(childComponent);
                        }
                    } else {
                        found = found.concat(childComponent.querySelectorAllComponent(selector));
                    }
                }
            } else {
                for (var i = 0, childComponent; (childComponent = childComponents[i]); i++) {
                    if (rightHandOperand === Montage.getInfoForObject(childComponent).label) {
                        if (rest) {
                            found = found.concat(childComponent.querySelectorAllComponent(rest));
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
        value: null
    },

/**
        Specifies whether the component has an HTML template file associated with it.
        @type {Property}
        @default {Boolean} true
*/
    hasTemplate: {
        value: true
    },

/**
        Description TODO
        @type {Property}
        @default null
*/
    templateModuleId: {
        value: null
    },

    _template: {
        value: null
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
        value: function() {
            this.needsDraw = false;
            this.traverseComponentTree(function(component) {
                Object.deleteBindings(component);
                component.needsDraw = false;
            });
        }
    },

    originalContent: {
        value: null
    },

    _newContent: {
        enumerable: false,
        value: null
    },

    content: {
        get: function() {
            if (this._element) {
                return Array.prototype.slice.call(this._element.childNodes, 0);
            } else {
                return null;
            }
        },
        set: function(value) {
            var components = [],
                childNodes;

            this._newContent = value;
            this.needsDraw = true;

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
            } else {
                for (var i = 0; i < value.length; i++) {
                    findAndDetachComponents(value[i]);
                }
            }

            // find the component fringe and detach them from the component tree
            function findAndDetachComponents(node) {
                var component = node.controller;

                if (component) {
                    component.detachFromParentComponent();
                    components.push(component);
                } else {
                    var childNodes = node.childNodes;
                    for (var i = 0, childNode; (childNode = childNodes[i]); i++) {
                        findAndDetachComponents(childNode);
                    }
                }
            }

            // not sure if I can rely on _cachedParentComponent to detach the nodes instead of doing one loop for dettach and another to attach...
            for (var i = 0, component; (component = components[i]); i++) {
                this._addChildComponent(component);
            }
        }
    },

/**
    Description TODO
    @function
    */
    deserializedFromSerialization: {
        value: function() {
            this.attachToParentComponent();
            if (this._element) {
                this.originalContent = Array.prototype.slice.call(this._element.childNodes, 0);
            }
            if (!("identifier" in this)) {
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
                // this actually also serves as isTemplateInstantiating
                self._isTemplateInstantiated = true;
                template.instantiateWithComponent(self, function() {
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
        var templateModuleId, info, moduleId;

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

        templateModuleId = this.templateModuleId;
        info = Montage.getInfoForObject(this);
        if (!templateModuleId) {
            moduleId = info.moduleId;
            // TODO: backwards compatibility for components with its controller outside the reel folder
            //if (/([^\/]+)\.reel\/\1$/.exec(moduleId)) {
            //    templateModuleId = moduleId + ".html";
            //} else if (/([^\/]+)\.reel$/.exec(moduleId)) {
            //    templateModuleId = moduleId + "/" + RegExp.$1 + ".html";
            //} else {
                var slashIndex = moduleId.lastIndexOf("/");
                //templateModuleId = moduleId + ".reel/" + moduleId.split("/").pop() + ".html";
                templateModuleId = moduleId + "/" + moduleId.slice(slashIndex === -1 ? 0 : slashIndex+1, -5) + ".html";
            //}
        }
        if (logger.isDebug) {
            logger.debug(this, "Will load " + templateModuleId);
        }
        // this call will be synchronous if the template is cached.
        Template.templateWithModuleId(info.require, templateModuleId, onTemplateLoad);
    }},

    templateDidDeserializeObject: {
        value: function(object) {
            if (Component.isPrototypeOf(object)) {
                object.ownerComponent = this;
            }
        }
    },

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
        value: function _drawIfNeeded() {
            var body,
                childComponent,
                oldDrawList;
            if (this.needsDraw) {
                rootComponent.addToDrawCycle(this);
            }
            if (drawLogger.isDebug) {
                drawLogger.debug(this, "drawList: " + (this._drawList || []).length + " of " + this.childComponents.length);
            }
            if (this._drawList !== null && this._drawList.length > 0) {
                oldDrawList = this._drawList;
                this._drawList = [];
                while ((childComponent = oldDrawList.shift())) {
                    if (drawLogger.isDebug) {
                        drawLogger.debug("Parent Component " + (this.element != null ? this.element.id : "") + " drawList length: " + oldDrawList.length);
                    }
                    childComponent._addedToDrawList = false;
                    if (drawLogger.isDebug) {
                        drawLogger.debug(this, "childComponent: " + childComponent.element + "; canDraw: " + childComponent.canDraw());
                    }
                    if (childComponent.canDraw()) { // TODO if canDraw is false when does needsDraw get reset?
                        childComponent._drawIfNeeded();
                    }
                }
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
                    continue;
                } else {
                    value = (template.getAttribute(attributeName) || "") + (attributeName === "style" ? "; " : " ") +
                        attribute.nodeValue;
                }

                template.setAttribute(attributeName, value);
            }

            element.parentNode.replaceChild(template, element);

            this.eventManager.unregisterEventHandlerForElement(element);
            this.eventManager.registerEventHandlerForElement(this, template);
            this._element = template;
            this._templateElement = null;
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
    _draw: {
        value: function() {
            var contents = this._newContent,
                element;

            this._canDrawTable = {};
            this._canDrawCount = 0;

            if (contents) {
                element = this._element;

                element.innerHTML = "";

                if (contents instanceof Element) {
                    element.appendChild(contents);
                } else {
                    for (var i = 0, content; (content = contents[i]); i++) {
                        element.appendChild(content);
                    }
                }

                this._newContent = null;
                if (typeof this.contentDidChange === "function") {
                    this.contentDidChange();
                }
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
        <li><it needs an element/li>
        <li><a draw must have been requested/li>
     </ol>
     @type {Function}
     @default {Boolean} false
     */
    needsDraw: {
        enumerable: true,
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
        enumerable: true,
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
        distinct: true
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
            var length, i;
            length = this.composerList.length;
            for (i = 0; i < length; i++) {
                this.composerList[i].unload();
            }
            this.composerList = [];
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
            var component;
            while ((component = this._needsDrawList.shift())) {
                if (component.needsDraw) {
                    component._addToParentsDrawList();
                }
            }
            this._clearNeedsDrawTimeOut = null;
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
/**
    Description TODO
    @function
    */
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
                        console.group((timestamp ? drawLogger.toTimeString(new Date(timestamp)) + " " : "") + "Draw Fired");
                    }
                    self.drawIfNeeded();
                    if (drawLogger.isDebug) {
                        console.groupEnd();
                    }
                    self._frameTime = null;
                    if (self._scheduleComposerRequest) {
                        self.drawTree();
                    }
                };
                if (requestAnimationFrame) {
                    this.requestedAnimationFrame = requestAnimationFrame.call(window, _drawTree);
                } else {
                    //1000/17 = 60fps
                    this.requestedAnimationFrame = setTimeout(_drawTree, 16);
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

            if (component._firstDraw) {

                if (component.parentComponent && typeof component.parentComponent.childComponentWillPrepareForDraw === "function") {
                    component.parentComponent.childComponentWillPrepareForDraw(component);
                }

                component._prepareForDraw();
                if (component.prepareForDraw) {
                    component.prepareForDraw();
                }

                // Load any non lazyLoad composers that have been added
                length = component.composerList.length;
                for (i = 0; i < length; i++) {
                    composer = component.composerList[i];
                    if (!composer.lazyLoad) {
                        composer._load();
                    }
                }

                // Will we expose a different property, firstDraw, for components to check
                component._firstDraw = false;
            }
        }
    },


    /**
        @function
        @returns !!needsDrawList.length
    */
    drawIfNeeded:{
        value: function drawIfNeeded() {
            var needsDrawList = this._readyToDrawList, component, j, i, start = 0, firstDrawEvent,
                composerList = this.composerList, composer, length;
            needsDrawList.length = 0;
            this._readyToDrawListIndex = {};
            this.composerList = [];

            // Process the composers first so that any components that need to be newly drawn due to composer changes
            // get added in this cycle
            length = composerList.length;
            for (i = 0; i < length; i++) {
                composer = composerList[i];
                composer.needsFrame = false;
                composer.frame(this._frameTime);
            }

            this._drawIfNeeded();
            j = needsDrawList.length;
            while (start < j) {
                for (i = start; i < j; i++) {
                    component = needsDrawList[i];
                    if (typeof component.willDraw === "function") {
                        component.willDraw(this._frameTime);
                    }
                    if (drawLogger.isDebug) {
                        drawLogger.debug(component._montage_metadata.objectName, " didDraw");
                    }
                }
                this._drawIfNeeded();
                start = j;
                j = needsDrawList.length;
            }

            for (i = 0; i < j; i++) {
                component = needsDrawList[i];
                component.needsDraw = false;
            }

            this.requestedAnimationFrame = null; // Allow a needsDraw called during a draw to schedule the next draw
            // TODO: add the posibility to display = "none" the body during development (IKXARIA-3631).
            for (i = j-1; i >= 0; i--) {
                component = needsDrawList[i];
                component._draw();
                component.draw(this._frameTime);
                if (drawLogger.isDebug) {
                    drawLogger.debug(component._montage_metadata.objectName, " draw");
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
                    drawLogger.debug(component._montage_metadata.objectName, " didDraw");
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

            if (typeof this.didSetElement === "function") {
                this.didSetElement();
            }
        },
        enumerable: false
    }
});

rootComponent.init().element = document;
//if(window.parent && window.parent.jasmine) {
exports.__root__ = rootComponent;
//}
