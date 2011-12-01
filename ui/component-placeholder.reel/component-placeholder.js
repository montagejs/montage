/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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
