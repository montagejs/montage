/*global Element */
/**
 * @module montage/ui/component
 * @requires montage
 * @requires montage/ui/template
 * @requires montage/core/gate
 * @requires montage/core/logger | component
 * @requires montage/core/logger | drawing
 * @requires montage/core/event/event-manager
 */
var Montage = require("../core/core").Montage,
    Target = require("../core/target").Target,
    Template = require("../core/template").Template,
    DocumentResources = require("../core/document-resources").DocumentResources,
    Gate = require("../core/gate").Gate,
    Promise = require("../core/promise").Promise,
    logger = require("../core/logger").logger("component"),
    drawPerformanceLogger = require("../core/logger").logger("Drawing performance").color.green(),
    drawListLogger = require("../core/logger").logger("drawing list").color.blue(),
    needsDrawLogger = require("../core/logger").logger("drawing needsDraw").color.violet(),
    drawLogger = require("../core/logger").logger("drawing").color.blue(),
    defaultEventManager = require("../core/event/event-manager").defaultEventManager,
    Set = require("collections/set"),
    Alias = require("../core/serialization/alias").Alias;

var ATTR_LE_COMPONENT="data-montage-le-component";
var ATTR_LE_ARG="data-montage-le-arg";
var ATTR_LE_ARG_BEGIN="data-montage-le-arg-begin";
var ATTR_LE_ARG_END="data-montage-le-arg-end";

/**
 * @requires montage/ui/component-description
 */
/**
 * @class Component
 * @classdesc Base class for all Montage components.
 * @extends Montage
 */
var Component = exports.Component = Target.specialize(/** @lends Component# */ {
    DOM_ARG_ATTRIBUTE: {value: "data-arg"},

    constructor: {
        value: function Component() {
            this.super();
            this._isComponentExpanded = false;
            this._isTemplateLoaded = false;
            this._isTemplateInstantiated = false;
            this._isComponentTreeLoaded = false;
        }
    },

    /**
     * A delegate is an object that has helper methods specific to particular
     * components.
     * For example, a TextField may consult its `deletate`'s
     * `shouldBeginEditing()` method, or inform its `delegate` that it
     * `didBeginEditing()`.
     * Look for details on the documentation of individual components'
     * `delegate` properties.
     *
     * @type {?Object}
     * @default null
    */
    delegate: {
        value: null
    },

    /**
     * This property is populated by the template. It is a map of all the
     * instances present in the template's serialization keyed by their label.
     *
     * @type {Object}
     * @default null
     */
    templateObjects: {
        serializable: false,
        value: null
    },

    _nextTarget: {
        value: null
    },

    /**
     * The next Target to consider in the event target chain
     *
     * Currently, components themselves do not allow this chain to be broken;
     * setting a component's nextTarget to a falsy value will cause nextTarget
     * to resolve as the parentComponent.
     *
     * To interrupt the propagation path a Target that accepts a falsy
     * nextTarget needs to be set at a component's nextTarget.
     *
     * @type {Target}
     */
    nextTarget: {
        get: function () {
            return this._nextTarget || this.parentComponent;
        },
        set: function (value) {
            this._nextTarget = value;
        }
    },

    _ownerDocumentPart: {
        value: null
    },

    _templateDocumentPart: {
        value: null
    },

    _domArguments: {
        value: null
    },

    _domArgumentNames: {
        value: null
    },

    /**
     * Dispatch the actionEvent this component is configured to emit upon interaction
     * @private
     */
    _dispatchActionEvent: {
        value: function() {
            this.dispatchEvent(this.createActionEvent());
        },
        enumerable: false
    },

    /**
     * Convenience to create a custom event named "action"
     * @method
     * @returns and event to dispatch upon interaction
     */
    createActionEvent: {
        value: function() {
            var actionEvent = document.createEvent("CustomEvent");
            actionEvent.initCustomEvent("action", true, true, null);
            return actionEvent;
        }
    },

    /**
     * The gate controlling the canDraw() response of the component.
     * @type {Gate}
     * @private
     */
    canDrawGate: {
        get: function() {
            if (!this._canDrawGate) {
                this._canDrawGate = new Gate().initWithDelegate(this);
                this._canDrawGate.setField("componentTreeLoaded", false);
            }
            return this._canDrawGate;
        },
        enumerable: false
    },

    _blockDrawGate: {
        value: null
    },

    /**
     * The gate controlling whether the component will ask to draw.
     * @type {Gate}
     * @private
     */
    blockDrawGate: {
        enumerable: false,
        get: function() {
            if (!this._blockDrawGate) {
                this._blockDrawGate = new Gate().initWithDelegate(this);
                this._blockDrawGate.setField("element", false);
                this._blockDrawGate.setField("drawRequested", false);
            }
            return this._blockDrawGate;
        }
    },

    _firstDraw: {
        enumerable: false,
        value: true
    },

    _completedFirstDraw: {
        enumerable: false,
        value: false
    },

    originalElement: {
        value: null
    },

    /**
     * @private
     */
    _element: {
        enumerable: false,
        value: null
    },

    /**
     * The element of the component as defined in the template.
     * ```json
     * {
     *    "component": {
     *        "properties": {
     *            "element": {"#": "dataMontageId"}
     *        }
     *    }
     * }
     * ```
     * DOM arguments can be passed to the component as direct children of the
     * element. By default the entire content of the element is considered the
     * single DOM argument of the component.
     * Multiple arguments can be given by assigning a `data-arg` attribute to
     * each element that represents an argument.
     *
     * ```html
     * <div data-montage-id="component">
     *     <h1 data-arg="title"></h1>
     *     <div data-arg="content">
     *         <span data-montage-id="text"></span>
     *     <div>
     * </div>
     * ```
     *
     * If the component has a template then this element is replaced by the
     * element that is referenced in its template just before the component
     * enters the document.
     * ```json
     * {
     *    "owner": {
     *        "properties": {
     *            "element": {"#": "dataMontageId"}
     *        }
     *    }
     * }
     * ```
     *
     * The component element has a `component` property that points back to the
     * component. This property is specially useful to extrapolate the component
     * tree from the DOM tree. It can also be used for debugging purposes, on
     * the webkit inspector when an element is selected it's possible to find
     * its component by using the `$0.component` command on the console.
     *
     * The element of a component can only be assigned once, it's not possible
     * to change it.
     *
     * @type {DOMElement}
     * @default null
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

            //jshint -W106
            if (window._montage_le_flag) {
            //jshint +W106
                value.setAttribute(ATTR_LE_COMPONENT, Montage.getInfoForObject(this).moduleId);
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
            this._initializeClassListFromElement(value);
        }
    },

    getElementId: {
        value: function() {
            var element = this._element;

            if (element) {
                return element.getAttribute("data-montage-id");
            }
        }
    },

    _initDomArguments: {
        value: function() {
            var candidates,
                domArguments = {},
                name,
                node,
                element = this.element;

            candidates = element.querySelectorAll("*[" + this.DOM_ARG_ATTRIBUTE + "]");

            // Need to make sure that we filter dom args that are for nested
            // components and not for this component.
            nextCandidate:
            for (var i = 0, candidate; (candidate = candidates[i]); i++) {
                node = candidate;
                while ((node = node.parentNode) !== element) {
                    // This candidate is inside another component so skip it.
                    if (node.component) {
                        continue nextCandidate;
                    }
                }
                this._findAndDetachComponents(candidate);
                candidate.parentNode.removeChild(candidate);
                name = candidate.getAttribute(this.DOM_ARG_ATTRIBUTE);
                candidate.removeAttribute(this.DOM_ARG_ATTRIBUTE);
                domArguments[name] = candidate;
            }

            this._domArguments = domArguments;
        }
    },

    getDomArgumentNames: {
        value: function() {
            if (!this._domArgumentNames) {
                this._domArgumentNames = Object.keys(this._domArguments);
            }
            return this._domArgumentNames;
        }
    },

    /**
     * This function extracts a DOM argument that was in the element assigned
     * to the component.
     * The star (`*`) argument refers to the entire content of the element when
     * no `data-arg` was given.
     *
     * When a DOM argument is extracted from a Component it is no longer
     * available
     *
     * @method
     * @param {string} name The name of the argument, or `"*"` for the entire
     * content.
     * @returns the element
     */
    extractDomArgument: {
        value: function(name) {
            var argument;

            argument = this._domArguments[name];
            this._domArguments[name] = null;

            return argument;
        }
    },

    /**
     * This function is used to get a Dom Argument out of the origin template
     * (_ownerDocumentPart) of this component.
     * It is not meant to be used with a live DOM, its main purpose it to help
     * the TemplateArgumentProvider implementation.
     *
     * @private
     */
    _getTemplateDomArgument: {
        value: function(name) {
            var candidates,
                node,
                element,
                elementId,
                serialization,
                labels,
                template = this._ownerDocumentPart.template;

            element = template.getElementById(this.getElementId());
            candidates = element.querySelectorAll("*[" + this.DOM_ARG_ATTRIBUTE + "='" + name + "']");

            // Make sure that the argument we find is indeed part of element and
            // not an argument from an inner component.
            nextCandidate:
            for (var i = 0, candidate; (candidate = candidates[i]); i++) {
                node = candidate;
                while ((node = node.parentNode) !== element) {
                    elementId = template.getElementId(node);

                    // Check if this node is an element of a component.
                    // TODO: Make this operation faster
                    if (elementId) {
                        serialization = template.getSerialization();
                        labels = serialization.getSerializationLabelsWithElements(
                            elementId);

                        if (labels.length > 0) {
                            // This candidate is inside another component so
                            // skip it.
                            continue nextCandidate;
                        }
                    }
                }
                return candidate;
            }
        }
    },

    /**
     * TemplateArgumentProvider implementation
     */

    getTemplateArgumentElement: {
        value: function(argumentName) {
            var template = this._ownerDocumentPart.template,
                element,
                range,
                argument;

            //jshint -W106
            if (window._montage_le_flag) {
                var ownerModuleId = this.ownerComponent._montage_metadata.moduleId;
                var label = this._montage_metadata.label;
            }

            if (argumentName === "*") {
                element = template.getElementById(this.getElementId());

                range = template.document.createRange();
                range.selectNodeContents(element);
                argument = range.cloneContents();
                if (window._montage_le_flag && element.children.length > 0) {
                    this._leTagStarArgument(ownerModuleId, label, argument);
                }
            } else {
                argument = this._getTemplateDomArgument(argumentName).cloneNode(true);
                argument.removeAttribute(this.DOM_ARG_ATTRIBUTE);
                if (window._montage_le_flag) {
                    this._leTagNamedArgument(ownerModuleId, label, argument,
                        argumentName);
                }
            }
            //jshint +W106

            return argument;
        }
    },

    getTemplateArgumentSerialization: {
        value: function(elementIds) {
            var template = this._ownerDocumentPart.template;

            return template._createSerializationWithElementIds(elementIds);
        }
    },

    /**
     * @param {string} templatePropertyName "<componentLabel>:<propertyName>"
     * @private
     */
    resolveTemplateArgumentTemplateProperty: {
        value: function(templatePropertyName) {
            var ix = templatePropertyName.indexOf(":"),
                componentLabel = templatePropertyName.slice(0, ix),
                propertyName = templatePropertyName.slice(ix),
                documentPart = this._templateDocumentPart,
                aliasTemplatePropertyName,
                aliasComponent,
                alias,
                result;

            // Check if the template property is referring to this object at all.
            if (Montage.getInfoForObject(this).label !== componentLabel) {
                return;
            }

            if (documentPart) {
                alias = documentPart.objects[propertyName];
            }

            if (alias instanceof Alias) {
                aliasComponent = documentPart.objects[alias.componentLabel];
                // Strip the @ prefix
                aliasTemplatePropertyName = alias.value.slice(1);
                result = aliasComponent.resolveTemplateArgumentTemplateProperty(aliasTemplatePropertyName);
                if (!result) {
                    result = aliasTemplatePropertyName;
                }
            }

            return result;
        }
    },

    setElementWithParentComponent: {
        value: function(element, parent) {
            this._alternateParentComponent = parent;
            if (this.element !== element) {
                this.element = element;
            }
        }
    },

    // access to the Application object
    /**
     * Convenience to access the application object.
     * @type {Application}
    */
    application: {
        enumerable: false,
        get: function() {
            return require("../core/application").application;
        }
    },

    /**
     * Convenience to access the defaultEventManager object.
     * @type {EventManager}
     */
    eventManager: {
        enumerable: false,
        get: function() {
            return defaultEventManager;
        }
    },

    /**
     * Convenience to access the rootComponent object.
     * @type {RootComponent}
     */
    rootComponent: {
        enumerable: false,
        get: function() {
            return rootComponent;
        }
    },

    /**
     * @method
     * @returns targetElementController
     * @private
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
     * @private
     */
    __parentComponent: {
        value: null
    },

    _parentComponent: {
        set: function(value) {
            this.__parentComponent = value;
            this.dispatchOwnPropertyChange("parentComponent", value);
        },
        get: function() {
            return this.__parentComponent;
        }
    },

    /**
     * The parent component is the component that is found by walking up the
     * DOM tree, starting at the component's `element`. Each component element
     * has a `component` property that points back to the component object, this
     * way it's possible to know which component an element represents.
     *
     * This value is null for the {@link RootComponent}.
     *
     * @type {Component}
     */
    parentComponent: {
        enumerable: false,
        get: function() {
            return this._parentComponent;
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
                found,
                i,
                childComponent;

            if (leftHandOperand) {
                rest = rightHandOperand ? "@"+rightHandOperand + rest : "";

                for (i = 0, childComponent; (childComponent = childComponents[i]); i++) {
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
                for (i = 0, childComponent; (childComponent = childComponents[i]); i++) {
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
                found = [],
                i,
                childComponent;

            if (leftHandOperand) {
                rest = rightHandOperand ? "@"+rightHandOperand + rest : "";
                for (i = 0, childComponent; (childComponent = childComponents[i]); i++) {
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
                for (i = 0, childComponent; (childComponent = childComponents[i]); i++) {
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
     * The template object of the component.
     *
     * @type {Template}
     * @default null
     */
    template: {
        enumerable: false,
        value: null
    },

    /**
     * Specifies whether the component has an HTML template file associated with
     * it.
     * @type {boolean}
     * @default true
     */
    hasTemplate: {
        enumerable: false,
        value: true
    },

    /**
     * @private
     * @type {string}
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
     * @private
     * @deprecated
     * @method
     * @param {Component} childComponent
     */
    // TODO update all calls to use addChildComponent and remove this method.
    _addChildComponent: {
        value: function(childComponent) {
            return this.addChildComponent(childComponent);
        }
    },

    addChildComponent: {
        value: function (childComponent) {
            if (this.childComponents.indexOf(childComponent) === -1) {
                this.childComponents.push(childComponent);
                childComponent._prepareForEnterDocument();
                childComponent._parentComponent = this;

                if (childComponent.needsDraw &&
                    !this.rootComponent.isComponentWaitingNeedsDraw(childComponent)) {
                    childComponent._addToParentsDrawList();
                }
            }
        }
    },

    attachToParentComponent: {
        value: function() {
            this.detachFromParentComponent();
            this._parentComponent = null;

            var parentComponent = this.findParentComponent(),
                childComponents,
                childComponent;

            if (parentComponent) {
                // This component's children may have been attached to the
                // parent before we were initialized, and so we now need to
                // check if any of our parent's children should actually be
                // ours.
                childComponents = parentComponent.childComponents;
                for (var i = 0; (childComponent = childComponents[i]); i++) {
                    var newParentComponent = childComponent.findParentComponent();
                    if (newParentComponent === this) {
                        parentComponent.removeChildComponent(childComponent);
                        newParentComponent.addChildComponent(childComponent);
                    }
                }

                parentComponent.addChildComponent(this);
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

    removeChildComponent: {
        value: function(childComponent) {
            var childComponents = this.childComponents,
                ix = childComponents.indexOf(childComponent);

            if (ix > -1) {

                childComponent._exitDocument();

                childComponents.splice(ix, 1);
                childComponent._parentComponent = null;
                childComponent._alternateParentComponent = null;

                if (childComponent._addedToDrawList) {
                    childComponent._addedToDrawList = false;
                    ix = this._drawList.indexOf(childComponent);
                    this._drawList.splice(ix, 1);
                }
                this.rootComponent.removeFromCannotDrawList(childComponent);
            }
        }
    },

    /**
     * The child components of the component.
     * This property is readonly and should never be changed.
     *
     * @type {Array.<Component>}
     * @readonly
    */
    childComponents: {
        enumerable: false,
        distinct: true,
        value: []
    },

    _needsEnterDocument: {
        value: false
    },

    _inDocument: {
        value: false
    },

    __exitDocument: {
        value: function() {
            if (this._inDocument && typeof this.exitDocument === "function") {
                this.exitDocument();
                this._inDocument = false;
            }
        }
    },

    _exitDocument: {
        value: function() {
            var traverse;

            if (this._needsEnterDocument) {
                this._needsEnterDocument = false;
            } else {
                traverse = function (component) {
                    var childComponents = component.childComponents,
                        childComponent;

                    for (var i = 0; (childComponent = childComponents[i]); i++) {
                        if (childComponent._isComponentExpanded) {
                            traverse(childComponent);
                        }
                    }

                    if (component._inDocument) {
                        component.__exitDocument();
                    }
                };

                traverse(this);
            }
        }
    },

    /**
     * Lifecycle method called when this component is removed from the
     * document's DOM tree.
     * @method
     */
    exitDocument: {
        value: function () {
            if (this.isActiveTarget) {
                defaultEventManager.activeTarget = this.nextTarget;
            }
        }
    },

    _prepareForEnterDocument: {
        value: function() {
            // On their first draw components will have their needsDraw = true
            // when they loadComponentTree.
            if (this._firstDraw) {
                this._needsEnterDocument = true;
            } else {
                this.needsDraw = true;
                this.traverseComponentTree(function(component) {
                    if (component._needsEnterDocument) {
                        return false;
                    }
                    component._needsEnterDocument = true;
                    component.needsDraw = true;
                });
            }
        }
    },

    /**
     * The owner component is the owner of the template form which this
     * component was instantiated.
     * @type {Component}
     * @default null
     */
    ownerComponent: {
        enumerable: false,
        value: null
    },

    /**
     * Unused?
     * @private
     */
    components: {
        enumerable: false,
        value: {}
    },

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
     * @method
     * @private
     */
    cleanupDeletedComponentTree: {
        value: function(cancelBindings) {
            // Deleting bindings in all cases was causing the symptoms expressed in gh-603
            // Until we have a more granular way we shouldn't do this,
            // the cancelBindings parameter is a short term fix.
            if (cancelBindings) {
                this.cancelBindings();
            }
            this.needsDraw = false;
            this.traverseComponentTree(function(component) {
                // See above comment
                if (cancelBindings) {
                    component.cancelBindings();
                }
                component.needsDraw = false;
            });
        }
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
                componentsToAdd = [],
                i,
                component;

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
            for (i = 0, component; (component = components[i]); i++) {
                component.detachFromParentComponent();
            }

            if (value instanceof Element) {
                this._findAndDetachComponents(value, componentsToAdd);
            } else if (value && value[0]) {
                for (i = 0; i < value.length; i++) {
                    this._findAndDetachComponents(value[i], componentsToAdd);
                }
            }

            // not sure if I can rely on _parentComponent to detach the nodes instead of doing one loop for dettach and another to attach...
            for (i = 0, component; (component = componentsToAdd[i]); i++) {
                this.addChildComponent(component);
            }
        }
    },

    _shouldClearDomContentOnNextDraw: {
        value: false
    },

    _findAndDetachComponents: {
        value: function(node, components) {
            // TODO: Check if searching the childComponents of the parent
            //       component can make the search faster..
            var component = node.component,
                children;

            if (!components) {
                components = [];
            }

            if (component) {
                component.detachFromParentComponent();
                components.push(component);
            } else {
                // DocumentFragments don't have children so we default to
                // childNodes.
                children = node.children || node.childNodes;
                for (var i = 0, child; (child = children[i]); i++) {
                    this._findAndDetachComponents(child, components);
                }
            }

            return components;
        }
    },

    // Some components, like the repetition, might use their initial set of
    // child components as a template to clone them and instantiate them as the
    // real/effective child components.
    //
    // When this happens the original child components are in a way pointless
    // to the application and should not be used.
    //
    // If other objects get a reference to these child components in the
    // template serialization the way to know that they are going to be
    // cloned is by checking if one of their parent components has
    // its clonesChildComponents set to true.
    clonesChildComponents: {
        writable: false,
        value: false
    },

    _innerTemplate: {value: null},

    innerTemplate: {
        serializable: false,
        get: function() {
            var innerTemplate = this._innerTemplate,
                ownerDocumentPart,
                ownerTemplate,
                elementId,
                serialization,
                externalObjectLabels,
                ownerTemplateObjects,
                externalObjects;

            if (!innerTemplate) {
                ownerDocumentPart = this._ownerDocumentPart;

                if (ownerDocumentPart) {
                    ownerTemplate = ownerDocumentPart.template;

                    elementId = this.getElementId();
                    innerTemplate = ownerTemplate.createTemplateFromElementContents(elementId);

                    serialization = innerTemplate.getSerialization();
                    externalObjectLabels = serialization.getExternalObjectLabels();
                    ownerTemplateObjects = ownerDocumentPart.objects;
                    externalObjects = Object.create(null);

                    for (var i = 0, label; (label = externalObjectLabels[i]); i++) {
                        externalObjects[label] = ownerTemplateObjects[label];
                    }
                    innerTemplate.setInstances(externalObjects);

                    this._innerTemplate = innerTemplate;
                }
            }

            return innerTemplate;
        },
        set: function(value) {
            this._innerTemplate = value;
        }
    },

    /**
     * This method is called right before draw is called.
     * If ```canDraw()``` returns false, then the component is re-added to the parent's draw list and draw isn't called.
     * @method
     * @returns {boolean} true or false
     * @private this method is evil
     */
    canDraw: {
        value: function() {
            return this._canDraw;
        }
    },

    _canDraw: {
        get: function() {
            return (!this._canDrawGate || this._canDrawGate.value);
        },
        set: function(value) {
            rootComponent.componentCanDraw(this, value);
        },
        enumerable: false
    },

    _prepareCanDraw: {
        enumerable: false,
        value: function _prepareCanDraw() {
            if (!this._isComponentTreeLoaded) {
                this.loadComponentTree().done();
            }
        }
    },

    _blocksOwnerComponentDraw: {
        value: false
    },

    _updateOwnerCanDrawGate: {
        value: function() {
            if (this._blocksOwnerComponentDraw && this.ownerComponent) {
                this.ownerComponent.canDrawGate.setField(this.uuid, this.canDrawGate.value);
            }
        }
    },

    _isComponentTreeLoaded: {
        value: null
    },

    shouldLoadComponentTree: {
        value: true
    },

    _loadComponentTreeDeferred: {value: null},
    loadComponentTree: {
        value: function loadComponentTree() {
            var self = this,
                canDrawGate = this.canDrawGate,
                deferred = this._loadComponentTreeDeferred;

            if (!deferred) {
                deferred = Promise.defer();
                this._loadComponentTreeDeferred = deferred;

                canDrawGate.setField("componentTreeLoaded", false);

                // only put it in the root component's draw list if the
                // component has requested to be draw, it's possible to load the
                // component tree without asking for a draw.
                // What about the hasTemplate check?
                if (this.needsDraw || this.hasTemplate) {
                    this._canDraw = false;
                }

                this.expandComponent().then(function() {
                    if (self.hasTemplate || self.shouldLoadComponentTree) {
                        var promises = [],
                            childComponents = self.childComponents,
                            childComponent;

                        for (var i = 0; (childComponent = childComponents[i]); i++) {
                            promises.push(childComponent.loadComponentTree());
                        }

                        return Promise.all(promises);
                    }
                }).then(function() {
                    self._isComponentTreeLoaded = true;
                    // When the component tree is loaded we need to draw if the
                    // component needs to have its enterDocument() called.
                    // This is because we explicitly avoid drawing when we set
                    // _needsEnterDocument before the first draw because we
                    // don't want to trigger the draw before its component tree
                    // is loaded.
                    if (self._needsEnterDocument) {
                        self.needsDraw = true;
                    }
                    canDrawGate.setField("componentTreeLoaded", true);
                    deferred.resolve();
                }, deferred.reject).done();
            }
            return deferred.promise;
        }
    },

    /**
     *  Whenever traverseComponentTree reaches the end of a subtree Component#expandComponent~callback is called.
     * @method
     * @param {Component#traverseComponentTree~visitor} visitor  visitor
     * @param {Component#traverseComponentTree~callback} callback callback object
     * @private
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

            var visitorFunction = function() {
                if (--childLeftCount === 0 && callback) {
                    callback();
                }
            };
            for (var i = 0; (childComponent = childComponents[i]); i++) {
                childComponent.traverseComponentTree(visitor, visitorFunction);
            }
        }

        if (this._isComponentExpanded) {
            traverse();
        } else if (callback) {
            callback();
        }
    }},
    /**
     * Visitor function for Component#traverseComponentTree. For every component in the tree, the visitor function is
     * called with the current component as an argument.
     * If the function returns false then the traversal is stopped for that subtree.
     * @method Component#traverseComponentTree~visitor
     * @param Component visitedComponent
     */
    /**
     * @method Component#traverseComponentTree~callback
     */


    /**
     * @method
     * @param {Component#expandComponent~callback} callback  TODO
     * @private
     */
    _expandComponentDeferred: {value: null},
    expandComponent: {
        value: function expandComponent() {
            var self = this,
                deferred = this._expandComponentDeferred;

            if (!deferred) {
                deferred = Promise.defer();
                this._expandComponentDeferred = deferred;

                if (this.hasTemplate) {
                    this._instantiateTemplate().then(function() {
                        self._isComponentExpanded = true;
                        self._addTemplateStyles();
                        self.needsDraw = true;
                        deferred.resolve();
                    }, deferred.reject);
                } else {
                    this._isComponentExpanded = true;
                    deferred.resolve();
                }
            }

            return deferred.promise;
        }
    },

    _templateObjectDescriptor: {
        value: {
            enumerable: true,
            configurable: true
        }
    },

    _setupTemplateObjects: {
        value: function(objects) {
            this.templateObjects = Object.create(null);
            this._addTemplateObjects(objects);
        }
    },

    _addTemplateObjects: {
        value: function(objects) {
            var descriptor = this._templateObjectDescriptor,
                templateObjects = this.templateObjects;

            for (var label in objects) {
                var object = objects[label];

                if (typeof object === "object" && object != null) {
                    if (!Component.prototype.isPrototypeOf(object) || object === this ||
                        object.parentComponent === this) {
                        templateObjects[label] = object;
                    } else {
                        descriptor.get = this._makeTemplateObjectGetter(this, label, object);
                        Object.defineProperty(templateObjects, label, descriptor);
                    }
                }
            }
        }
    },

    _makeTemplateObjectGetter: {
        value: function(owner, label, object) {
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
                    } else if (components.length === 0) {
                        // We didn't find any in the component tree
                        // so it was probably removed in the meanwhile.
                        // We return the one that was in the template
                        // TODO: need to make sure this component hasn't been
                        // disposed.
                        return object;
                    }

                    isRepeated = true;
                    return components;
                }
            };
        }
    },

    _instantiateTemplate: {
        value: function() {
            var self = this;
            return this._loadTemplate().then(function(template) {
                if (!self._element) {
                    console.error("Cannot instantiate template without an element.", self);
                    return Promise.reject(new Error("Cannot instantiate template without an element.", self));
                }
                var instances = self.templateObjects,
                    _document = self._element.ownerDocument;

                if (!instances) {
                    instances = Object.create(null);
                }
                instances.owner = self;

                self._isTemplateInstantiated = true;

                return template.instantiateWithInstances(instances, _document)
                .then(function(documentPart) {
                    documentPart.parentDocumentPart = self._ownerDocumentPart;
                    self._templateDocumentPart = documentPart;
                    documentPart.fragment = null;
                })
                .fail(function(reason) {
                    var message = reason.stack || reason;
                    console.error("Error in", template.getBaseUrl() + ":", message);
                    throw reason;
                });
            });
        }
    },

    _templateDidLoad: {
        value: function(documentPart) {
            this._setupTemplateObjects(documentPart.objects);
        }
    },

    _loadTemplatePromise: {value: null},
    _loadTemplate: {
        value: function _loadTemplate() {
            var self = this,
                promise = this._loadTemplatePromise,
                info;

            if (!promise) {
                info = Montage.getInfoForObject(this);

                promise = this._loadTemplatePromise = Template.getTemplateWithModuleId(
                    this.templateModuleId, info.require)
                .then(function(template) {
                    self._template = template;
                    self._isTemplateLoaded = true;

                    return template;
                });
            }

            return promise;
        }
    },

    /**
     * @private
     * @type {string}
     * @default
     */
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

    deserializedFromSerialization: {
        value: function() {
            this.attachToParentComponent();
        }
    },

    _deserializedFromTemplate: {
        value: function(owner, label, documentPart) {
            Montage.getInfoForObject(this).label = label;
            this._ownerDocumentPart = documentPart;

            if (! this.hasOwnProperty("identifier")) {
                this.identifier = label;
            }

            if (!this.ownerComponent) {
                if (Component.prototype.isPrototypeOf(owner)) {
                    this.ownerComponent = owner;
                } else {
                    this.ownerComponent = this.rootComponent;
                }
                this._updateOwnerCanDrawGate();
            }

            if (this._needsDrawInDeserialization) {
                this.needsDraw = true;
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
                if ((dotIndex < moduleId.length) && ( moduleId.slice(dotIndex, moduleId.length) === ".reel")) {
                    // We are in a reel
                    blueprintModuleId = moduleId + "/" + moduleId.slice(slashIndex, dotIndex) + ".meta";
                } else {
                    // We look for the default
                    blueprintModuleId = moduleId.slice(0, dotIndex) + ".meta";
                }

                Montage.defineProperty(self, "_blueprintModuleId", {
                    value: blueprintModuleId
                });
            }
            return self._blueprintModuleId;
        }
    },

    blueprint: require("../core/core")._blueprintDescriptor,

    /**
     * Callback for the ```canDrawGate```.
     * Propagates to the parent and adds the component to the draw list.
     * @method
     * @param {Gate} gate
     * @see Component#canDrawGate
     * @private
     */
    gateDidBecomeTrue: {
        value: function(gate) {
            if (gate === this._canDrawGate) {
                this._canDraw = true;
                this._updateOwnerCanDrawGate();
            } else if (gate === this._blockDrawGate) {
                rootComponent.componentBlockDraw(this);
                this._prepareCanDraw();
            }
        },
        enumerable: false
    },

    gateDidBecomeFalse: {
        value: function(gate) {
            if (gate === this._canDrawGate) {
                this._updateOwnerCanDrawGate();
            }
        },
        enumerable: false
    },

    /**
     * Gate that controls the _canDraw property. When it becomes true it sets
     * _canDraw to true.
     * @method
     * @returns Gate
     * @private
     */
    _canDrawGate: {
        enumerable: false,
        value: null
    },

    _preparedForActivationEvents: {
        enumerable: false,
        value: false
    },

    _arrayObjectPool: {
        value: {
            pool: null,
            size: 200,
            ix: 0
        }
    },

    _getArray: {
        value: function() {
            if (this._arrayObjectPool.pool == null) {
                this._arrayObjectPool.pool = [];
                for (var i = 0; i < this._arrayObjectPool.size; i++) {
                    this._arrayObjectPool.pool[i] = [];
                }
            }

            if (this._arrayObjectPool.ix < this._arrayObjectPool.size) {
                return this._arrayObjectPool.pool[this._arrayObjectPool.ix++];
            } else {
                return [];
            }
        }
    },

    _disposeArray: {
        value: function(array) {
            if (this._arrayObjectPool.ix > 0) {
                array.length = 0;
                this._arrayObjectPool.pool[--this._arrayObjectPool.ix] = array;
            }
        }
    },

    /**
     * If needsDraw property returns true this call adds the current component
     * instance to the rootComponents draw list.
     * Then it iterates on every child component in the component's drawList.
     * On everyone of them it calls ```canDraw()```.
     * If the result is true, ```_drawIfNeeded()``` is called, otherwise they
     * are ignored.
     * @private
     */
    _drawIfNeeded: {
        enumerable: false,
        value: function _drawIfNeeded(level) {
            var childComponent,
                oldDrawList, i, childComponentListLength,
                firstDraw = this._firstDraw;

            this._treeLevel = level;
            if (firstDraw) {
                this.originalElement = this.element;
            }
            if (this.needsDraw) {
                rootComponent.addToDrawCycle(this);
            }
            if (firstDraw && this.prepareForDraw) {
                Montage.callDeprecatedFunction(this, this.prepareForDraw, "prepareForDraw", "enterDocument(firstTime)");
            }
            if (this._needsEnterDocument) {
                this._needsEnterDocument = false;
                this._inDocument = true;
                if (typeof this.enterDocument === "function") {
                    this.enterDocument(firstDraw);
                }
                this._enterDocument(firstDraw);
            }
            if (firstDraw) {
                this.originalElement = null;
            }

            if (this._drawList !== null && this._drawList.length > 0) {
                oldDrawList = this._drawList;
                this._drawList = this._getArray();
                childComponentListLength = oldDrawList.length;
                for (i = 0; i < childComponentListLength; i++) {
                    childComponent = oldDrawList[i];
                    childComponent._addedToDrawList = false;
                    if (childComponent.canDraw()) { // TODO if canDraw is false when does needsDraw get reset?
                        childComponent._drawIfNeeded(level+1);
                    } else if (drawLogger.isDebug) {
                        drawLogger.debug(loggerToString(childComponent) + " can't draw.");
                    }
                }
                this._disposeArray(oldDrawList);
            }
        }
    },

    _updateComponentDom: {
        value: function() {
            var component, composer, length, i;
            if (this._firstDraw) {

                this._prepareForDraw();

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
                    //jshint -W106
                    logger.debug("Component content changed: component ", this._montage_metadata.objectName, this.identifier, " newDomContent", this._newDomContent);
                    //jshint +W106
                }
                this._performDomContentChanges();
            }
        }
    },

    _replaceElementWithTemplate: {
        enumerable: false,
        value: function() {
            var element = this.element,
                template = this._templateElement,
                attributes = this.element.attributes,
                attributeName,
                value,
                i,
                attribute,
                templateAttributeValue;

            // TODO: get a spec for this, what attributes should we merge?
            for (i = 0; (attribute = attributes[i]); i++) {
                attributeName = attribute.nodeName;
                //jshint -W106
                if (window._montage_le_flag && attributeName === ATTR_LE_COMPONENT) {
                    //jshint +W106
                    value = attribute.nodeValue;
                } else if (attributeName === "id" || attributeName === "data-montage-id") {
                    value = attribute.nodeValue;
                } else {
                    templateAttributeValue = template.getAttribute(attributeName) || "";
                    if (templateAttributeValue) {
                        value = templateAttributeValue +
                            (attributeName === "style" ? "; " : " ") +
                            attribute.nodeValue;
                    } else {
                        value = attribute.nodeValue;
                    }
                }

                template.setAttribute(attributeName, value);
            }

            this._initializeClassListFromElement(template);

            if (element.parentNode) {
                element.parentNode.replaceChild(template, element);
            } else if (!this._canDrawOutsideDocument) {
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

    _addTemplateStyles: {
        value: function() {
            var part = this._templateDocumentPart,
                resources,
                styles,
                _document;

            if (part) {
                resources = part.template.getResources();
                _document = this.element.ownerDocument;
                styles = resources.createStylesForDocument(_document);

                for (var i = 0, style; (style = styles[i]); i++) {
                    this.rootComponent.addStylesheet(style);
                }
            }
        }
    },

    _prepareForDraw: {
        value: function _prepareForDraw() {
            if (logger.isDebug) {
                logger.debug(this, "_templateElement: " + this._templateElement);
            }

            var leTagArguments;
            //jshint -W106
            if (window._montage_le_flag) {
                //jshint +W106
                leTagArguments = this.element.children.length > 0;
            }
            this._initDomArguments();
            if (leTagArguments) {
                this._leTagArguments();
            }
            if (this._templateElement) {
                this._bindTemplateParametersToArguments();
                this._replaceElementWithTemplate();
            }
        },
        enumerable: false
    },

    _leTagArguments: {
        value: function() {
            //jshint -W106
            var ownerModuleId = this.ownerComponent._montage_metadata.moduleId;
            var label = this._montage_metadata.label;
            //jshint +W106
            var argumentNames = this.getDomArgumentNames();
            if (argumentNames.length === 0) {
                this._leTagStarArgument(ownerModuleId, label, this.element);
            } else {
                for (var i = 0, name; name = /*assign*/argumentNames[i]; i++) {
                    this._leTagNamedArgument(ownerModuleId, label,
                        this._domArguments[name], name);
                }
            }
        }
    },

    _getNodeFirstElement: {
        value: function(node) {
            var element = node.firstElementChild;

            if (!element) {
                element = node.firstChild;
                do {
                    if (element.nodeType === Node.ELEMENT_NODE) {
                        break;
                    }
                } while (element =/*assign*/ element.nextSibling);
            }

            return element;
        }
    },

    _getNodeLastElement: {
        value: function(node) {
            var element = node.lastElementChild;

            if (!element) {
                element = node.lastChild;
                do {
                    if (element.nodeType === Node.ELEMENT_NODE) {
                        break;
                    }
                } while (element =/*assign*/ element.previousSibling);
            }

            return element;
        }
    },

    _leTagStarArgument: {
        value: function(ownerModuleId, label, rootElement) {
            var argumentBegin = this._getNodeFirstElement(rootElement);
            var argumentEnd = this._getNodeLastElement(rootElement);

            argumentBegin.setAttribute(ATTR_LE_ARG_BEGIN,
                (argumentBegin.getAttribute(ATTR_LE_ARG_BEGIN)||"") + " " +
                    ownerModuleId + "," + label);
            argumentEnd.setAttribute(ATTR_LE_ARG_END,
                (argumentEnd.getAttribute(ATTR_LE_ARG_END)||"") + " " +
                    ownerModuleId + "," + label);
        }
    },

    _leTagNamedArgument: {
        value: function(ownerModuleId, label, element, name) {
            element.setAttribute(ATTR_LE_ARG,
                ownerModuleId + "," + label + "," + name);
        }
    },

    _bindTemplateParametersToArguments: {
        value: function() {
            var parameters = this._templateDocumentPart.parameters,
                parameter,
                templateArguments,
                argument,
                validation,
                contents,
                components,
                range,
                component;

            templateArguments = this._domArguments;

            if (!this._template.hasParameters() &&
                templateArguments.length === 1) {
                return;
            }

            validation = this._validateTemplateArguments(
                templateArguments, parameters);
            if (validation) {
                throw validation;
            }

            for (var key in parameters) {
                parameter = parameters[key];
                argument = templateArguments[key];

                if (key === "*") {
                    range = this._element.ownerDocument.createRange();
                    range.selectNodeContents(this._element);
                    contents = range.extractContents();
                } else {
                    contents = argument;
                }

                components = this._findAndDetachComponents(contents);
                parameter.parentNode.replaceChild(contents, parameter);
                for (var i = 0; (component = components[i]); i++) {
                    component.attachToParentComponent();
                }
            }
        }
    },

    _validateTemplateArguments: {
        value: function(templateArguments, templateParameters) {
            var parameterNames = Object.keys(templateParameters),
                argumentNames,
                param;

            // If the template does not have parameters it is up to the
            // component to use its arguments.
            if (parameterNames.length === 0) {
                return;
            }

            if (templateArguments == null) {
                if (parameterNames.length > 0) {
                    return new Error('No arguments provided for ' +
                    this.templateModuleId + '. Arguments needed: ' +
                    parameterNames + '.');
                }
            } else {
                if ("*" in templateParameters) {
                    argumentNames = Object.keys(templateArguments);
                    if (argumentNames.length > 0) {
                        return new Error('Arguments "' + argumentNames +
                        '" were given to component but no named parameters ' +
                        'are defined in ' + this.templateModuleId);
                    }
                } else {
                    // All template parameters need to be satisfied.
                    for (param in templateParameters) {
                        if (!(param in templateArguments)) {
                            return new Error('"' + param + '" argument not ' +
                            'given in ' + this.templateModuleId);
                        }
                    }
                    // Arguments for non-existant parameters are not allowed.
                    // Only the star argument is allowed.
                    for (param in templateArguments) {
                        if (param !== "*" && !(param in templateParameters)) {
                            return new Error('"' + param + '" parameter does ' +
                            'not exist in ' + this.templateModuleId);
                        }
                    }
                }
            }
        }
    },

    /**
     * Called by the {@link EventManager} before dispatching a `touchstart` or
     * `mousedown`.
     *
     * The component can implement this method to add event listeners for these
     * events before they are dispatched.
     * @method
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

    _performDomContentChanges: {
        value: function() {
            var contents = this._newDomContent,
                oldContent = this._element.childNodes[0],
                childNodesCount,
                element;

            if (contents || this._shouldClearDomContentOnNextDraw) {
                element = this._element;

                // Setting the innerHTML to clear the children will not work on
                // IE because it modifies the underlying child nodes. Here's the
                // test case that shows this issue: http://jsfiddle.net/89X6F/
                childNodesCount = this._element.childNodes.length;
                for (var i = 0; i < childNodesCount; i++) {
                    element.removeChild(element.firstChild);
                }

                if (Element.isElement(contents)) {
                    element.appendChild(contents);
                } else if(contents != null) {
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

    // TODO: remove
    prepareForDraw: {
        enumerable: false,
        value: null
    },

    /**
     * This method is part of the draw cycle and is the prescribed location for
     * components to update its DOM structure or modify its styles.
     *
     * Components should not read the DOM during this phase of the draw cycle
     * as it could force an unwanted reflow from the browser.
     *
     * @method
     * @see http://montagejs.org/docs/Component-draw-cycle.html
     */
    draw: {
        enumerable: false,
        value: function() {
        }
    },

    /**
     * This method is part of the draw cycle and it provides the component an
     * opportunity to query the DOM for any necessary calculations before
     * drawing.
     * If the execution of this method sets needsDraw to true on other
     * components, those components will be added to the current draw cycle.
     *
     * Components should not change the DOM during this phase of the draw cycle
     * as it could force an unwanted reflow from the browser.
     *
     * @method
     * @see http://montagejs.org/docs/Component-draw-cycle.html
     */
    willDraw: {
        enumerable: false,
        value: null
    },

    /**
     * This method is part of the draw cycle and it provides the component an
     * opportunity to query the DOM for any necessary calculations after
     * drawing.
     * If the execution of this method sets needsDraw to true on other
     * components, those components will be added to the current draw cycle.
     *
     * Components should not change the DOM during this phase of the draw cycle
     * as it could force an unwanted reflow from the browser.
     *
     * @method
     * @see http://montagejs.org/docs/Component-draw-cycle.html
     */
    didDraw: {
        enumerable: false,
        value: function() {
        }
    },

    /**
     * Records whether or not we have been added to the parent's drawList.
     * @private
     */
    _addedToDrawList: {
        value: false
    },

    _addToParentsDrawList: {
        enumerable: false,
        value: function() {
            if (!this._addedToDrawList) {
                var parentComponent = this.parentComponent;

                if (!parentComponent) {
                    if (drawListLogger.isDebug) {
                        drawListLogger.debug(this, "parentComponent is null");
                    }
                } else {
                    parentComponent._addToDrawList(this);
                    if (drawListLogger.isDebug) {
                        //jshint -W106
                        drawListLogger.debug(loggerToString(this) + " added to " + loggerToString(parentComponent)  + "'s drawList");
                        //jshint +W106
                    }
                }
            }
        }
    },

    _needsDraw: {
        value: false
    },

    _needsDrawInDeserialization: {
        value: false
    },

    /**
     * The purpose of this property is to trigger the adding of the component to
     * the draw list. The draw list consists of all the components that will be
     * drawn on the next draw cycle.
     *
     * The draw cycle itself is triggered by the `requestAnimationFrame` API
     * where available, otherwise a shim implemented with `setTimeout` is used.
     *
     * When it happens, the draw cycle will call, in succession, and when they
     * exist, the methods: `willDraw`, `draw`, and `didDraw`.
     *
     * At the end of the draw cycle this property is set back to `false`.
     *
     * @type {boolean}
     * @default false
     */
    needsDraw: {
        enumerable: false,
        get: function() {
            return !!this._needsDraw;
        },
        set: function(value) {
            if (this.isDeserializing) {
                // Ignore needsDraw(s) which happen during deserialization
                this._needsDrawInDeserialization = true;
                return;
            }
            if (this._needsDraw !== value) {
                if (needsDrawLogger.isDebug) {
                    //jshint -W106
                    needsDrawLogger.debug("needsDraw toggled " + value + " for " + this._montage_metadata.objectName);
                    //jshint +W106
                }
                this._needsDraw = !!value;
                if (value) {
                    if (this.canDrawGate.value) {
                        this._addToParentsDrawList();
                    } else {
                        this.blockDrawGate.setField("drawRequested", true);
                    }
                }
            }
        }
    },

    /**
     * Contains the list of childComponents this instance is reponsible for drawing.
     * @private
     */
    _drawList: {
        value: null
    },

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
     * Adds the passed in child component to the drawList
     * If the current instance isn't added to the drawList of its parentComponent, then it adds itself.
     * @private
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
     * Ask this component to surrender the specified pointer to the
     * demandingComponent.
     *
     * The component can decide whether or not it should do this given the
     * pointer and demandingComponent involved.
     *
     * Some components may decide not to surrender control ever, while others
     * may do so in certain situations.
     *
     * Returns true if the pointer was surrendered, false otherwise.
     *
     * The demandingComponent is responsible for claiming the surrendered
     * pointer if it desires.
     *
     * @method
     * @param {string} pointer The `pointerIdentifier` that the demanding
     * component is asking this component to surrender
     * @param {Object} demandingComponent The component that is asking this
     * component to surrender the specified pointer
     * @returns {boolean} true
     */
    surrenderPointer: {
        value: function(pointer, demandingComponent) {
            return true;
        }
    },

    // Composers
    /**
     * Variable to track this component's associated composers
     * @private
     */
    composerList: {
        value: [],
        distinct: true,
        serializable: false
    },

    /**
     * Adds the passed in composer to the component's composer list.
     * @method
     * @param {Composer} composer
     */
    addComposer: {  // What if the same composer instance is added to more than one component?
        value: function(composer) {
            this.addComposerForElement(composer, composer.element);
        }
    },

    /**
     * Adds the passed in composer to the component's composer list and
     * sets the element of the composer to the passed in element.
     * @method
     * @param {Composer} composer
     * @param {Element} element
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
     * Adds the passed in composer to the list of composers which will have their
     * frame method called during the next draw cycle.  It causes a draw cycle to be scheduled
     * iff one has not already been scheduled.
     * @method
     * @param {Composer} composer
     */
    scheduleComposer: {
        value: function(composer) {
            this.rootComponent.addToComposerList(composer);
        }
    },

    /**
     * Removes the passed in composer from this component's composer list.  It takes care
     * of calling the composers unload method before removing it from the list.
     * @method
     * @param {Composer} composer
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
     * A convenience method for removing all composers from a component.  This method
     * is responsible for calling unload on each composer before removing it.
     * @method
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
     * The localizer for this component
     * @type {Localizer}
     * @default null
     */
    localizer: {
        value: null
    },

    _waitForLocalizerMessages: {
        value: false
    },

    /**
     * Whether to wait for the localizer to load messages before drawing.
     * Make sure to set the [localizer]{@link Component#localizer} before
     * setting to ```true```.
     *
     * @type {boolean}
     * @default false
     * @example
     * // require localizer
     * var defaultLocalizer = localizer.defaultLocalizer,
     *     _ = defaultLocalizer.localizeSync.bind(defaultLocalizer);
     *
     * exports.Main = Component.specialize( {
     *
     *     constructor: {
     *         value: function() {
     *             this.localizer = defaultLocalizer;
     *             this.waitForLocalizerMessages = true;
     *         }
     *     },
     *
     *     // ...
     *
     *     // no draw happens until the localizer's messages have been loaded
     *     enterDocument: {
     *         value: function(firstTime) {
     *             if (firstTime) {
     *                 this._greeting = _("hello", "Hello {name}!");
     *             }
     *         }
     *     },
     *     draw: {
     *         value: function() {
     *             // this is for illustration only. This example is simple enough that
     *             // you should use a localizations binding
     *             this._element.textContent = this._greeting({name: this.name});
     *         }
     *     }
     * }
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
     * Stores values that need to be set on the element. Cleared each draw cycle.
     * @private
     */
    _elementAttributeValues: {
        value: null
    },

    /**
     * Stores the descriptors of the properties that can be set on this control
     * @private
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
     * Adds a property to the component with the specified name.
     * This method is used internally by the framework convert a DOM element's
     * standard attributes into bindable properties.
     * It creates an accessor property (getter/setter) with the same name as
     * the specified property, as well as a "backing" data property whose name
     * is prepended with an underscore (_).
     * The backing variable is assigned the value from the property descriptor.
     * For example, if the name "title" is passed as the first parameter, a
     * "title" accessor property is created as well a data property named
     * "_title".
     * @method
     * @param {string} name The property name to add.
     * @param {Object} descriptor An object that specifies the new properties default attributes such as configurable and enumerable.
     * @private
     */
    defineAttribute: {
        value: function(name, descriptor) {
            descriptor = descriptor || {};
            var _name = '_' + name;


            var newDescriptor = {
                configurable: (typeof descriptor.configurable === 'undefined') ? true: descriptor.configurable,
                enumerable: (typeof descriptor.enumerable === 'undefined') ?  true: descriptor.enumerable,
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
            // TODO this.constructor.defineProperty
            Montage.defineProperty(this.prototype, _name, {value: null});
            // Define property getter and setter
            Montage.defineProperty(this.prototype, name, newDescriptor);
        }
    },

    /**
     * Add the specified properties as properties of this component.
     * @method
     * @param {object} properties An object that contains the properties you want to add.
     * @private
     */
    addAttributes: {
        value: function(properties) {
            var i, descriptor, property, object;
            this.prototype._elementAttributeDescriptors = properties;

            for(property in properties) {
                if(properties.hasOwnProperty(property)) {
                    object = properties[property];
                    // Make sure that the descriptor is of the correct form.
                    if(object === null || typeof object === "string") {
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

    /**
     * This function is called when the component element is added to the
     * document's DOM tree.
     *
     * @method Component#enterDocument
     * @param {boolean} firstTime `true` if it's the first time the component
     *                  enters the document.
     */

// callbacks

    _enterDocument: {
        value: function(firstTime) {
            var originalElement;

            if (firstTime) {
// The element is now ready, so we can read the attributes that
                // have been set on it.
                originalElement = this.originalElement;

                var attributes, i, length, name, value, attributeName, descriptor;
                attributes = originalElement.attributes;
                if (attributes) {
                    length = attributes.length;
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
                                if( (typeof this[name] === 'undefined') || this[name] == null) {
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
                    var textContent = originalElement.textContent;

                    // if no attributes were needed this yet, we need it now
                    if(this._elementAttributeValues === null) {
                        this._elementAttributeValues = {};
                    }

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
            // classList
            this._drawClassListIntoComponent();
        }
    },

    _classList: {
        value: null
    },

    _classListDirty: {
        value: false
    },

    /**
     * The classList of the component's element, the purpose is to mimic the
     * element's API but to also respects the draw cycle.
     *
     * It can also be bound to by binding each class as a property.
     * example to toggle the complete class:
     * ```json
     * "classList.has('complete')" : { "<-" : "@owner.isComplete"}
     * ```
     * @type {Set}
     * @default null
     */
    classList: {
        get: function () {
            if (this._classList === null) {
                this._classList = new Set();
                this._subscribeToToClassListChanges();
                this._initializeClassListFromElement(this.element);
            }
            return this._classList;
        }
    },

    _initializeClassListFromElement: {
        value: function(element) {
            var className;
            if (element && element.className && (className = element.className.trim())) {
                // classList
                if (className.length !== 0) {
                    // important to initializae the classList first, so that the listener doesn't get installed.
                    var classList = this.classList;
                    if (this._unsubscribeToClassListChanges) {
                        this._unsubscribeToClassListChanges();
                    }
                    classList.addEach(className.split(/\s+/));
                    this._subscribeToToClassListChanges();
                }
            }

        }
    },

    _unsubscribeToClassListChanges: {
        value: null
    },

    _subscribeToToClassListChanges: {
        value: function() {
            this._unsubscribeToClassListChanges = this._classList.addRangeChangeListener(this, "classList");
        }
    },

    handleClassListRangeChange: {
        value: function (plus, minus) {
            this._classListDirty = true;
            this.needsDraw = true;
        }
    },

    _drawClassListIntoComponent: {
        value: function () {
            if (this._classListDirty) {
                var elementClassList = this.element.classList,
                    classList = this._classList;

                for (var i = 0, ii = elementClassList.length, className; i < ii; i++) {
                    className = elementClassList.item(i);
                    if (!classList.has(className)) {
                        elementClassList.remove(className);
                        i--;
                        ii--;
                    }
                }

                this._classList.forEach(function (cssClass) {
                    elementClassList.add(cssClass);
                });
                this._classListDirty = false;
            }
        }
    },

    dispose: {
        value: function() {
            this.cancelBindings();
            this.detachFromParentComponent();
            defaultEventManager.unregisterEventHandlerForElement(this, this._element);
            this._element = null;

            this.childComponents.forEach(function(component) {
                component.dispose();
            });
        }
    }
});


/**
 * @class RootComponent
 * @extends Component
 */
var RootComponent = Component.specialize( /** @lends RootComponent# */{
    constructor: {
        value: function RootComponent() {
            this.super();
            this._drawTree = this._drawTree.bind(this);
            this._readyToDrawListIndex = {};
        }
    },

    /**
     * @private
     * @method
     * @returns itself
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
                    //jshint -W106
                    for (var i = 0, childComponent; (childComponent = childComponents[i]); i++) {
                        if (needsDrawLogger.isDebug) {
                            needsDrawLogger.debug(this, "needsDraw = true for: " + childComponent._montage_metadata.exportedSymbol);
                        }
                        childComponent.needsDraw = true;
                    }
                    //jshint +W106
                }
            }
        }
    },

    canDrawGate: {
        get: function() {
            return this._canDrawGate || (this._canDrawGate = new Gate().initWithDelegate(this));
        }
    },

    _clearNeedsDrawTimeOut: {
        value: null
    },

    _needsDrawList: {
        value: []
    },

    _cannotDrawList: {
        value: null
    },

    /**
     * @method
     * @param {Object} component
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

    // TODO: implement this with a flag on the component
    isComponentWaitingNeedsDraw: {
        value: function(component) {
            return component.uuid in this._cannotDrawList ||
                this._needsDrawList.indexOf(component) >= 0;
        }
    },

    /**
     * @method
     * @param {Object} component
     * @param {number} value
     */
    componentCanDraw: {
        value: function(component, value) {
            if (value) {
                if (!this._cannotDrawList) {
                    return;
                }
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

    _clearNeedsDrawList: {
        value: function() {
            var component, i, length, needsDrawList = this._needsDrawList;
            length = needsDrawList.length;
            for (i = 0; i < length; i++) {
                component = needsDrawList[i];
                if (component.needsDraw ||
                    // Maybe the component doesn't need to draw but has child
                    // components that do.
                    (component._drawList && component._drawList.length > 0)) {
                    component._addToParentsDrawList();
                }
            }
            this._clearNeedsDrawTimeOut = null;
            needsDrawList.splice(0, length);
        }
    },

    /**
     * @method
     * @param {Component} componentId
     */
    removeFromCannotDrawList: {
        value: function(component) {
            if (!this._cannotDrawList) {
                return;
            }

            delete this._cannotDrawList[component.uuid];

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
     * Adds the passed in child component to the drawList.
     * @private
     */
    _addToDrawList: {
        value: function(childComponent) {
            this.__addToDrawList(childComponent);
            if (drawListLogger.isDebug) {
                drawListLogger.debug(this, this.canDrawGate.value, this.requestedAnimationFrame);
            }
            this.drawTree();
        },
        enumerable: false
    },

    /**
     * Adds the passed in composer to the list of composers to be executed
     * in the next draw cycle and requests a draw cycle if one has not been
     * requested yet.
     * @method
     * @param {Composer} composer
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
     * Flag to track if a composer is requesting a draw
     * @private
     */
    _scheduleComposerRequest: {
        value: false
    },

    /**
     * The value returned by requestAnimationFrame.
     * If a request has been scheduled but not run yet, else null.
     * @private
     * @type {number}
     * @default null
     */
    requestedAnimationFrame: {
        value: null,
        enumerable: false
    },

    /**
     * @private
     * @method
     */
    requestAnimationFrame: {
        value: (window.requestAnimationFrame || window.webkitRequestAnimationFrame
             || window.mozRequestAnimationFrame ||  window.msRequestAnimationFrame),
        enumerable: false
    },

    /**
     * @private
     * @method
     */
    cancelAnimationFrame: {
        value: (window.cancelAnimationFrame ||  window.webkitCancelAnimationFrame
             || window.mozCancelAnimationFrame || window.msCancelAnimationFrame),
        enumerable: false
    },

    /**
     * Set to the current time of the frame while drawing is in progress.
     * The frame time is either supplied by the requestAnimationFrame callback if available in the browser, or by using Date.now if it is a setTimeout.
     * @private
     */
    _frameTime: {
        value: null
    },

    /**
     * oldSource and diff are used to detect DOM modifications outside of the
     * draw loop, but only if drawLogger.isDebug is true.
     * @private
     */
    _oldSource: {
        value: null
    },
    _diff: {
        // Written by John Resig. Used under the Creative Commons Attribution 2.5 License.
        // http://ejohn.org/projects/javascript-diff-algorithm/
        value: function( o, n ) {
            var ns = {};
            var os = {};

            //jshint -W116
            for (var i = 0; i < n.length; i++ ) {
                if (ns[ n[i] ] == null ) {
                    ns[ n[i] ] = { rows: [], o: null };
                }
                ns[ n[i] ].rows.push( i );
            }

            for (i = 0; i < o.length; i++ ) {
                if (os[ o[i] ] == null ) {
                    os[ o[i] ] = { rows: [], n: null };
                }
                os[ o[i] ].rows.push( i );
            }

            for (i in ns ) {
                if (ns[i].rows.length === 1 && typeof(os[i]) !== "undefined" && os[i].rows.length === 1 ) {
                    n[ ns[i].rows[0] ] = { text: n[ ns[i].rows[0] ], row: os[i].rows[0] };
                    o[ os[i].rows[0] ] = { text: o[ os[i].rows[0] ], row: ns[i].rows[0] };
                }
            }

            for (i = 0; i < n.length - 1; i++ ) {
                if (n[i].text != null && n[i+1].text == null &&
                    n[i].row + 1 < o.length && o[ n[i].row + 1 ].text == null &&
                    n[i+1] == o[ n[i].row + 1 ]
                ) {
                    n[i+1] = { text: n[i+1], row: n[i].row + 1 };
                    o[n[i].row+1] = { text: o[n[i].row+1], row: i + 1 };
                }
            }

            for (i = n.length - 1; i > 0; i-- ) {
                if (n[i].text != null && n[i-1].text == null &&
                    n[i].row > 0 && o[ n[i].row - 1 ].text == null &&
                    n[i-1] == o[ n[i].row - 1 ]
                ) {
                    n[i-1] = { text: n[i-1], row: n[i].row - 1 };
                    o[n[i].row-1] = { text: o[n[i].row-1], row: i - 1 };
                }
            }
            //jshint +W116

            return { o: o, n: n };
        }
    },

    /**
     * @private
     */
    _previousDrawDate: {
        enumerable: false,
        value: 0
    },

    /**
     * @private
     */
    _documentResources: {
        value: null
    },

    /**
     * @private
     */
    _needsStylesheetsDraw: {
        value: false
    },

    /**
     * @private
     */
    _stylesheets: {
        value: []
    },

    /**
     * @private
     */
    addStylesheet: {
        value: function(style) {
            this._stylesheets.push(style);
            this._needsStylesheetsDraw = true;
        }
    },

    /**
     * @private
     */
    drawStylesheets: {
        value: function() {
            var documentResources = this._documentResources,
                stylesheets = this._stylesheets,
                stylesheet;

            while ((stylesheet = stylesheets.shift())) {
                documentResources.addStyle(stylesheet);
            }
            this._needsStylesheetsDraw = false;
        }
    },

    /**
     * @private
     */
    drawTree: {
        value: function drawTree() {
            if (this.requestedAnimationFrame === null) { // 0 is a valid requestedAnimationFrame value
                var requestAnimationFrame = this.requestAnimationFrame;
                if (requestAnimationFrame) {
                    this.requestedAnimationFrame = requestAnimationFrame.call(window, this._drawTree);
                } else {
                    // Shim based in Erik Möller's code at
                    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
                    var currentDate = Date.now(),
                        miliseconds = 17 - currentDate + this._previousDrawDate;

                    if (miliseconds < 0) {
                        miliseconds = 0;
                    }
                    this.requestedAnimationFrame = setTimeout(this._drawTree, miliseconds);
                    this._previousDrawDate = currentDate + miliseconds;
                }
                this._scheduleComposerRequest = false;
            }
        },
        enumerable: false
    },

    _drawTree: {
        value: function(timestamp) {
            var drawPerformanceStartTime;

            // Add all stylesheets needed by the components since last
            // draw.
            if (this._needsStylesheetsDraw) {
                this.drawStylesheets();
            }

            // Wait for all stylesheets to be loaded, do not proceeed
            // with the draw cycle until all needed stylesheets are
            // ready.
            // We need to do this because adding the stylesheets won't
            // make them immediately available for styling even if the
            // file is already loaded.
            if (!this._documentResources.areStylesLoaded) {
                if (drawPerformanceLogger.isDebug) {
                    console.log("Draw Cycle Waiting Stylesheets: ", this._documentResources._expectedStyles.length);
                }

                this.requestedAnimationFrame = null;
                this.drawTree();
                return;
            }

            if (drawPerformanceLogger.isDebug) {
                if (window.performance) {
                    drawPerformanceStartTime = window.performance.now();
                } else {
                    drawPerformanceStartTime = Date.now();
                }
            }
            this._frameTime = (timestamp ? timestamp : Date.now());
            if (this._clearNeedsDrawTimeOut) {
                this._clearNeedsDrawList();
            }
            if (drawLogger.isDebug) {
                // Detect any DOM modification since the previous draw
                var newSource = document.body.innerHTML;
                if (this._oldSource && newSource !== this._oldSource) {
                    var warning = ["DOM modified outside of the draw loop"];
                    var out = this._diff(this._oldSource.split("\n"), newSource.split("\n"));
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

            this.drawIfNeeded();

            if (drawPerformanceLogger.isDebug) {
                if (window.performance) {
                    var drawPerformanceEndTime = window.performance.now();
                } else {
                    var drawPerformanceEndTime = Date.now();
                }

                console.log("Draw Cycle Time: ",
                    drawPerformanceEndTime - drawPerformanceStartTime,
                    ", Components: ", this._lastDrawComponentsCount);
            }

            if (drawLogger.isDebug) {
                console.groupEnd();
                this._oldSource =  document.body.innerHTML;
            }
            this._frameTime = null;
            if (this._scheduleComposerRequest) {
                this.drawTree();
            }
        }
    },

    /**
     * @private
     */
    _readyToDrawList: {
        enumerable: false,
        value: []
    },

    /**
     * @private
     */
    _readyToDrawListIndex: {
        enumerable: false,
        value: null
    },

    /**
     * @method
     * @param {Component} component Component to add
     */
    addToDrawCycle: {
        value: function(component) {
            var needsDrawListIndex = this._readyToDrawListIndex, length, composer;

            if (needsDrawListIndex.hasOwnProperty(component.uuid)) {
                // Requesting a draw of a component that has already been drawn in the current cycle
                if (drawLogger.isDebug) {
                    if(this !== rootComponent) {
                        drawLogger.debug(loggerToString(this) + " added to the draw cycle twice, this should not happen.");
                    }
                }
                return;
            }
            this._readyToDrawList.push(component);
            this._readyToDrawListIndex[component.uuid] = true;

            component._updateComponentDom();
        }
    },


    _lastDrawComponentsCount: {
        value: null
    },

    _sortByLevel: {
        value: function(component1, component2) {
            return component1._treeLevel - component2._treeLevel;
        }
    },

    /**
     * @private
     * @method
     * @returns Boolean true if all the components that needed to draw have drawn
    */
    drawIfNeeded:{
        value: function drawIfNeeded() {
            var needsDrawList = this._readyToDrawList, component, i, j, start = 0, firstDrawEvent,
                composerList = this.composerList, composer, composerListLength;
            needsDrawList.length = 0;
            composerListLength = composerList.length;
            this._readyToDrawListIndex.clear();

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

            //
            // willDraw
            //
            if (drawLogger.isDebug) {
                console.groupCollapsed("willDraw - " + needsDrawList.length +
                    (needsDrawList.length > 1 ? " components." : " component."));
            }
            while (start < j) {
                for (i = start; i < j; i++) {
                    component = needsDrawList[i];
                    if (typeof component.willDraw === "function") {
                        component.willDraw(this._frameTime);
                    }
                    if (drawLogger.isDebug) {
                        drawLogger.debug("Level " + component._treeLevel + " " + loggerToString(component));
                    }
                }
                this._drawIfNeeded(0);
                start = j;
                j = needsDrawList.length;
            }
            //
            // draw
            //
            if (drawLogger.isDebug) {
                console.groupEnd();
                console.group("draw - " + needsDrawList.length +
                                    (needsDrawList.length > 1 ? " components." : " component."));
            }
            // Sort the needsDraw list so that any newly added items are drawn in the correct order re: parent-child
            needsDrawList.sort(this._sortByLevel);

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
                    drawLogger.debug("Level " + component._treeLevel + " " + loggerToString(component));
                }
            }
            //
            // didDraw
            //
            if (drawLogger.isDebug) {
                console.groupEnd();
                console.groupCollapsed("didDraw - " + needsDrawList.length +
                                    (needsDrawList.length > 1 ? " components." : " component."));
            }
            for (i = 0; i < j; i++) {
                component = needsDrawList[i];
                component.didDraw(this._frameTime);
                if(component.identifier === "channelListItem") {
                    console.log("component %s completedFirstDraw %s", Object.hash(component) , component._completedFirstDraw);
                }
                if (!component._completedFirstDraw) {
                    firstDrawEvent = document.createEvent("CustomEvent");
                    firstDrawEvent.initCustomEvent("firstDraw", true, false, null);
                    component.dispatchEvent(firstDrawEvent);
                    component._completedFirstDraw = true;
                }
                if (drawLogger.isDebug) {
                    drawLogger.debug("Level " + component._treeLevel + " " + loggerToString(component));
                }
            }
            if (drawLogger.isDebug) {
                console.groupEnd();
            }

            if (drawPerformanceLogger.isDebug) {
                this._lastDrawComponentsCount = needsDrawList.length;
            }

            return !!needsDrawList.length;
        }
    },

    /**
     * @private
     * @type {DOMElement}
     * @default null
     */
    element: {
        get:function() {
            return this._element;
        },
        set:function(value) {
            defaultEventManager.registerEventHandlerForElement(this, value);
            this._element = value;
            this._documentResources = DocumentResources.getInstanceForDocument(value);
        }
    }
});

var rootComponent = new RootComponent().init();
//if(window.parent && window.parent.jasmine) {
exports.__root__ = rootComponent;
//}

function loggerToString (object) {
    if (!object) return "NIL";
    //jshint -W106
    return object._montage_metadata.objectName + ":" + Object.hash(object) + " id: " + object.identifier;
    //jshint +W106
}
