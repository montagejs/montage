/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
// TODO: ComponentList instead? ComponentContainer?
/**
	@module "montage/ui/component-group.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage;
var Component = require("ui/component").Component;

/**
 @class module:"montage/ui/component-group.reel".ComponentGroup
 @extends module:montage/ui/component.Component
 */
var ComponentGroup = exports.ComponentGroup = Montage.create(Component, /** @lends module:"montage/ui/component-group.reel".ComponentGroup# */ {

    hasTemplate: {value: false},

/**
    Initializes the ComponentGroup instance's <code>childComponents</code> array with the specified array of components.
    @function
    @param {Component} components Components to be initialized.
    @returns itself
*/
    initWithComponents: {value: function(components) {
        this.childComponents = components;
        return this;
    }}
});
