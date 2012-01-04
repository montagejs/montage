/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
	@module "montage/ui/component-placeholder.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires core/logger
*/
var Montage = require("montage").Montage;
var Component = require("ui/component").Component;
var logger = require("core/logger").logger("componentplaceholder");
/**
 @class module:"montage/ui/component-placeholder.reel".ComponentPlaceHolder
 */

var ComponentPlaceHolder = exports.ComponentPlaceHolder = Montage.create(Component, /** @lends module:"montage/ui/component-placeholder.reel".ComponentPlaceHolder */ {

    hasTemplate: {value: false},

    name: {value: null},
/**
  Description TODO
  @private
*/
    _component: {
        serializable: true,
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _prepareForDraw: {value: function() {
        if (this.element) {
            this._replaceElementWithTemplate();
        }
    }},
/**
    Description TODO
    @function
    @returns this._component.draw.apply(this._component, arguments)
    */
    draw: {value: function() {
        return this._component.draw.apply(this._component, arguments);
    }},
/**
        Description TODO
        @type {Property}
        @default {Boolean} true
    */
    hasTemplate: {
        value: true
    },

    // TODO: Remove when old serialization is gone
    /**
    Description TODO
    @function
    @param {Component} visitor The visitor component.
    @param {Object} callback The callback object.
    */
    traverseComponentTree: {value: function(visitor, callback) {
        var self = this;
        var innerComponent = this._component;

        if (this._isComponentExpanded) {
            if (visitor) {
                visitor(this);
            }
            this._component.traverseComponentTree.apply(this._component, arguments);
        } else {
            this.expandComponent(function() {
                if (visitor) {
                    visitor(self);
                }
                self._component.traverseComponentTree(visitor, callback);
            });
        }
    }},
/**
  Description TODO
  @private
*/
    _replaceElementWithTemplate: {value: function() {
        var component = this._component,
            element = this.element,
            componentElement = component.element,
            attributes = element.attributes,
            attribute, attributeName, value;

        for (var i = 0; (attribute = attributes[i]); i++) {
            attributeName = attribute.nodeName;
            if (attributeName === "id") {
                continue;
            }
            value = (componentElement.getAttribute(attributeName) || "") + " " + attribute.nodeValue;
            componentElement.setAttribute(attributeName, value);
        }

        element.parentNode.replaceChild(componentElement, element);

        this._element = null;
        // check to see if the hosted component hasn't replaced its element yet, if not do it now.
        if (component._templateElement) {
            component._replaceElementWithTemplate();
        }
    }},

    // TODO: Add when old serialization is gone
    //deserializedFromTemplate: {value: function() {
    //    this._component = this.parentComponent[this.name];
    //}},

    // TODO: Remove when old serialization is gone
/**
    Description TODO
    @function
    @param {Object} callback The callback object.
    @returns self._component.loadComponentTree(callback)
    */
    loadComponentTree: {value: function(callback) {
        var self = this;
        Component.loadComponentTree.call(this, function() {
            self._component._cachedParentComponent = self._cachedParentComponent;
            return self._component.loadComponentTree(callback);
        });
    }},

    // TODO: Remove when old serialization is gone
    /**
    Description TODO
    @function
    @param {Object} callback The callback object.
    @returns this._component.expandComponent.apply(this._component, arguments)
    */
    expandComponent: {value: function(callback) {
        this._component = this.parentComponent[this.name];
        this._isComponentExpanded = true;

        return this._component.expandComponent.apply(this._component, arguments);
    }}
});
