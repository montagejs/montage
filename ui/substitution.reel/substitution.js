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
	@module "montage/ui/substitution.reel"
    @requires montage/ui/component
    @requires "montage/ui/slot.reel"
    @requires montage/core/logger
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    Slot = require("ui/slot.reel").Slot,
    Promise = require("core/promise").Promise,
    logger = require("core/logger").logger("substitution");
/**
 @class Substitution
 */
exports.Substitution = Slot.specialize( /** @lends Substitution# */ {

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
        value: function() {
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

    addSwitchElement: {
        value: function(key, element) {
            if (element.parentNode) {
                throw new Error("Can't handle elements inside the DOM.");
            }

            this._switchElements[key] = element;
            this._findFringeComponents(element, this._allChildComponents);
        }
    },

    _findFringeComponents: {
        value: function(element, components) {
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

    switchValue: {
        get: function() {
            return this._switchValue;
        },
        set: function(value) {

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
        value: function(firstTime) {
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
        value: function(value) {
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
        value: function(newContent, oldContent) {
            if (this._drawnSwitchValue) {
                this._switchElements[this._drawnSwitchValue] = oldContent;
            }
            this._drawnSwitchValue = this._switchValue;
        }
    },

    _loadSwitchComponentTree: {
        value: function(value) {
            var self = this,
                childComponents = this._allChildComponents,
                element = this._switchElements[value],
                substitutionElement = this.element,
                canDrawGate = this.canDrawGate,
                component,
                currentElement,
                promises = [];

            if (!element) {
                element = this._getDomArgument(substitutionElement, value);
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

                Promise.all(promises).then(function() {
                    self._switchComponentTreeLoaded[value] = true;
                    canDrawGate.setField(value + "ComponentTreeLoaded", true);
                    self._canDraw = true;
                    self.needsDraw = true;
                }).done();
            } else {
                this._switchComponentTreeLoaded[value] = true;
                this.needsDraw = true;
            }
        }
    },

    shouldLoadComponentTree: {
        value: false
    },

    transition: {
        value: null
    }
});
