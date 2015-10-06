/**
 * @module "montage/ui/substitution.reel"
 */
var Slot = require("../slot.reel").Slot,
    Promise = require("../../core/promise").Promise,
    logger = require("../../core/logger").logger("substitution");

/**
 * The substitution is a structural component and it should be used when there
 * are different types of content (e.g.: different panels) at the same time but
 * only one of them is shown at a time.
 *
 * A possible use case for the substitution is the implementation of a Tab
 * component content pane.
 *
 * The different types of content of a substitution are configured by declaring
 * them in the template as the DOM content of the substitution.
 * Each type of content is given to the substitution as a template argument.
 * Template arguments are declared by assigning the attribute `data-arg` to an
 * element that is the immediate child of the substitution.
 *
 * ##### Example - Declaring the substitution content
 * ```html
 * <div data-montage-id="substitution">
 *     <div data-arg="info" data-montage-id="infoPanel"></div>
 *     <div data-arg="contacts" data-montage-id="contactsPanel"></div>
 *     <div data-arg="review" data-montage-id="reviewPanel"></div>
 * </div>
 * ```
 * `info`, `contacts` and `review` are the types of content declared and
 * available as substitution content.
 * The type of content displayed by the substitution is defined by the
 * [switchValue]{@link Substitution#switchValue} property. The available values
 * of this property in this example are: `info`, `contacts` and `review`.
 *
 * ##### Example - Other substitution template configurations
 * ```html
 * <div data-montage-id="substitution">
 *     <div data-arg="info">
 *         Name: John Doe
 *     </div>
 *     <div data-arg="contacts">
 *         E-mail: ...
 *         Mobile: ...
 *     </div>
 *     <div data-arg="review">
 *         ...
 *     </div>
 * </div>
 * ```
 *
 * @class Substitution
 * @classdesc A structural component that reveals one of its template arguments
 * at a time.
 * @extends Slot
 */
exports.Substitution = Slot.specialize( /** @lends Substitution.prototype # */ {

    hasTemplate: {
        enumerable: false,
        value: false
    },

    constructor: {
        value: function Substitution() {
            this._switchElements = Object.create(null);
            this._switchComponentTreeLoaded = Object.create(null);
        }
    },

    _allChildComponents: {
        value: null
    },

    deserializedFromTemplate: {
        value: function () {
            this._allChildComponents = this.childComponents.slice(0);

            if (this.switchValue) {
                this._loadSwitchComponentTree(this.switchValue);
            }
        }
    },

    _switchElements: {
        value: null
    },
    _switchComponentTreeLoaded: {
        value: null
    },

    /**
     * This method is used to dynamically add content to the substitution. This
     * is usually done by declaring the content in the template as the DOM
     * content of the substitution. However, in more advanced usages of the
     * substitution, this information might not be available at writing time.
     *
     * Throws when the `element` given has a parent node.
     *
     * @function
     * @param {string} key The key that identifies the content given, similar to
     *                 `data-arg` when declaring the content in the template.
     * @param {Node} element The element that will be shown when the `key` is
     *               the selected [switchValue]{@link Substitution#switchValue}.
     *               This element needs to be detached from the DOM and cannot
     *               have a parent node.
     */
    addSwitchElement: {
        value: function (key, element) {
            if (element.parentNode) {
                throw new Error("Can't handle elements inside the DOM.");
            }

            this._switchElements[key] = element;
            this._findFringeComponents(element, this._allChildComponents);
        }
    },

    _findFringeComponents: {
        value: function (element, components) {
            var nodes;

            components = components || [];

            if (element.component) {
                components.push(element.component);
            } else {
                nodes = element.children;
                for (var i = 0, node; node = nodes[i]; i++) {
                    this._findFringeComponents(node, components);
                }
            }

            return components;
        }
    },

    _drawnSwitchValue: {
        value: null
    },

    _switchValue: {
        value: null
    },

    /**
     * The switch value selects which content the substitution should show.
     * The possible values are the ones defined as template arguments of the
     * substitution.
     *
     * @type {string}
     */
    switchValue: {
        get: function () {
            return this._switchValue;
        },
        set: function (value) {

            if (this._switchValue === value || this._isSwitchingContent) {
                return;
            }

            this._switchValue = value;

            // switchElements is only ready after the first draw
            // At first draw the substitution automatically draws what is in
            // the switchValue so we defer any content loading until the first
            // draw.
            if (!this._firstDraw && !this.isDeserializing) {
                this._loadContent(value);
            }
        }
    },

    enterDocument: {
        value: function (firstTime) {
            var argumentNames;

            Slot.enterDocument.apply(this, arguments);

            if (firstTime) {
                argumentNames = this.getDomArgumentNames();
                for (var i = 0, name; (name = argumentNames[i]); i++) {
                    this._switchElements[name] = this.extractDomArgument(name);
                }

                this._loadContent(this.switchValue);
                // TODO: Force the component to update its DOM now because the
                // updateComponentDom already happened for this draw cycle.
                // In the future the DrawManager will handle adding and
                // removing nodes from the DOM at any time before draw().
                this._updateComponentDom();
            }
        }
    },

    _loadContent: {
        value: function (value) {
            // If the value being loaded is already in the document then use it
            // instead of the element in the switchElements. The element in the
            // document could be a diferent one (if it is a component that had
            // its element replaced by its template).
            if (value === this._drawnSwitchValue) {
                this.content = this.element.children[0];
            } else {
                this.content = this._switchElements[value] || null;
            }

            if (!this._switchComponentTreeLoaded[value]) {
                this._loadSwitchComponentTree(value);
            }
        }
    },

    contentDidChange: {
        value: function (newContent, oldContent) {
            this.super();
            if (this._drawnSwitchValue) {
                this._switchElements[this._drawnSwitchValue] = oldContent;
            }
            this._drawnSwitchValue = this._switchValue;
        }
    },

    _loadSwitchComponentTree: {
        value: function (value) {
            var self = this,
                childComponents = this._allChildComponents,
                element = this._switchElements[value],
                substitutionElement = this.element,
                canDrawGate = this.canDrawGate,
                component,
                currentElement,
                promises = [];

            if (!element) {
                element = this._getSubstitutionDomArgument(value);
            }

            for (var i = 0; i < childComponents.length; i++) {
                component = childComponents[i];
                currentElement = component.element;

                // Search the DOM tree up until we find the switch element or
                // the substitution element
                while (currentElement !== element &&
                       currentElement !== substitutionElement &&
                       currentElement.parentNode) {
                    currentElement = currentElement.parentNode;
                }
                // If we found the switch element before finding the
                // substitution element it means this component is inside the
                // selected switch value.
                if (currentElement === element) {
                    promises.push(component.loadComponentTree());
                }
            }

            if (promises.length > 0) {
                canDrawGate.setField(value + "ComponentTreeLoaded", false);

                Promise.all(promises).then(function () {
                    self._switchComponentTreeLoaded[value] = true;
                    canDrawGate.setField(value + "ComponentTreeLoaded", true);
                    self._canDraw = true;
                    self.needsDraw = true;
                });
            } else {
                this._switchComponentTreeLoaded[value] = true;
                this.needsDraw = true;
            }
        }
    },

   /**
    * This function is used to get the dom arguments before the first draw,
    * _domArguments are only available at the first draw.
    * We need it before so we can start loading the component tree as soon as
    * possible without having to wait for the first draw.
    * @private
    */
    _getSubstitutionDomArgument: {
        value: function (name) {
            var candidates,
                node,
                element,
                elementId,
                serialization,
                labels,
                template = this._ownerDocumentPart.template;

            element = this.element;
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
     * By default the substitution doesn't expand the entire component tree of
     * all its content, only of the content that needs to be shown.
     * This is an optimization to avoid loading all the content at page load
     * time.
     *
     * However, if for some reason it is desirable to load the entire content
     * at page load time this property can be set to `true`.
     *
     * @type {boolean}
     * @default false
     */
    shouldLoadComponentTree: {
        value: false
    },

    transition: {
        value: null
    }
});
