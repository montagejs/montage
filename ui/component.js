/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module montage/ui/component
    @requires montage/core/core
    @requires montage/core/event/mutable-event
    @requires montage/core/bitfield
    @requires montage/ui/reel
    @requires montage/core/gate
    @requires montage/core/logger | component
    @requires montage/core/logger | drawing
    @requires montage/core/event/event-manager
*/
var Montage = require("montage").Montage,
    MutableEvent = require("core/event/mutable-event").MutableEvent,
    BitField = require("core/bitfield").BitField,
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
            actionEvent.type = "action";
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
                console.log("Warning: Tried to set element of ", this, " as " + value + ".");
                return;
            }

            this.eventManager.registerEventHandlerForElement(this, value);

            if (this.isDeserializing) {
                // if this component has a template and has been already instantiated then assume the value is the template.
                if (this._isTemplateInstantiated) {
                    this._templateElement = value;
                } else {
                    this._element = value;
                    if (!this.blockDrawGate.value && this._element) {
                        this.blockDrawGate.setField("element", true);
                    }
                }
            } else {
                this._element = value;
                if (!this.blockDrawGate.value && this._element) {
                    this.blockDrawGate.setField("element", true);
                }
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
                var anElement = this.element,
                    aParentNode,
                    eventManager = this.eventManager;
                if (anElement) {
                    while ((aParentNode = anElement.parentNode) !== null && eventManager.eventHandlerForElement(aParentNode) == null) {
                        anElement = aParentNode;
                    }
                    return (this._cachedParentComponent = aParentNode ? eventManager.eventHandlerForElement(aParentNode) : null);
                }
            } else {
                return cachedParentComponent;
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
    addChildComponent: {
        value: function(childComponent) {
            this.childComponents.push(childComponent);
        }
    },
/**
    Description TODO
    @function
    */
    attachToParentComponent: {
        value: function() {
            var parentComponent = this.parentComponent;
            if (parentComponent) {
                parentComponent.addChildComponent(this);
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
            }

            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
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
        serializable: true,
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
    Description TODO
    @function
    */
    deserializedFromSerialization: {
        value: function() {
            this.attachToParentComponent();
        }
    },

    serializeSelf: {
        value: function(serializer, propertyNames) {
            serializer.setProperties(propertyNames);
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
            //console.log(moduleId);
            if (/([^\/]+)\.reel\/\1$/.exec(moduleId)) {
                templateModuleId = moduleId + ".html";
            } else if (/([^\/]+)\.reel$/.exec(moduleId)) {
                templateModuleId = moduleId + "/" + RegExp.$1 + ".html";
            } else {
                templateModuleId = moduleId + ".reel/" + moduleId.split("/").pop() + ".html";
            }
            //console.log(moduleId + " === " + templateModuleId);
        }
        if (logger.isDebug) {
            logger.debug(this, "Will load " + templateModuleId);
        }
        // this call will be synchronous if the template is cached.
        Template.templateWithModuleId(info.require, templateModuleId, onTemplateLoad);
    }},
    /**
    Callback for the <code>_canDrawBitField</code>.<br>
    Propagates to the parent and adds the component to the draw list.
    @function
    @param {Property} gate
    @see _canDrawBitField
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
  Description TODO
  @private
*/
    _isDrawing: {
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
                if (attributeName === "id") {
                    continue;
                }
                value = (template.getAttribute(attributeName) || "") + " " +
                    attribute.nodeValue;
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
            this._element.removeAttribute("id");

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
  Description TODO
  @private
*/
    _draw: {
        value: function() {
            this._canDrawTable = {};
            this._canDrawCount = 0;
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
        Allows draw to be called even if the children can't draw.
        @type {Property}
        @default {Boolean} false
    */
    allowsPartialDraw: {
        value: false
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
                    drawLogger.debug("NEEDS DRAW TOGGLED " + value + " FOR " + (this.element != null ? this.element.id : ''));
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
            // if we are not added to the parent yet we add ourselves so that we build the tree
            if (!this._isDrawing) {
                this._addToParentsDrawList();
            }
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
                };
                if (requestAnimationFrame) {
                    this.requestedAnimationFrame = requestAnimationFrame.call(window, _drawTree);
                } else {
                    //1000/17 = 60fps
                    this.requestedAnimationFrame = setTimeout(_drawTree, 0);
                }
            }
        },
        enumerable: false
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    dispatchDrawEvent: {
        value: null
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
            var needsDrawListIndex = this._readyToDrawListIndex;

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
                // Will we expose a different property, firstDraw, for components to check
                component._firstDraw = false;
            }
        }
    },


    /**
        We set <code>display:none</code> on the body so that we cannot inadvertently cause a repaint.<br>
        @function
        @returns !!needsDrawList.length
    */
    /* TODO: Simplify this method if we are going to stick with needsDraw being called within a draw cycle always scheduling another draw.<br>
        Instead it should probably be changed to draw newly requested components in the same cycle, but schedule a new cycle for any components that have already been drawn once in the cycle and          are requesting to be drawn again. */
    drawIfNeeded:{
        value: function drawIfNeeded() {
            var body = this.element.body,
                needsDrawList = this._readyToDrawList, component;
            var j, i, start = 0, firstDrawEvent;
            needsDrawList.length = 0;
            this._readyToDrawListIndex = {};

            this._drawIfNeeded();
            j = needsDrawList.length;
            while (start < j) {
                for (i = start; i < j; i++) {
                    component = needsDrawList[i];
                    if (typeof component.willDraw === "function") {
                        component.willDraw(this._frameTime);
                    }
                }
                this._drawIfNeeded();
                start = j;
                j = needsDrawList.length;
            }

            this.requestedAnimationFrame = null; // Allow a needsDraw called during a draw to schedule the next draw
            // TODO: add the posibility to display = "none" the body during development (IKXARIA-3631).
            for (i = 0; i < j; i++) {
                component = needsDrawList[i];
                component.needsDraw = false;
                component._draw();
                component.draw(this._frameTime);
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
