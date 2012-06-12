/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module "montage/ui/input-date.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires montage/ui/text-input
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    TextInput = require("ui/text-input").TextInput;

/**
  	Wraps an &lt;input type="date"> element as a component.
    @class module:"montage/ui/input-date.reel".InputDate
    @extends module:montage/ui/text-input.TextInput
 */
var InputDate = exports.InputDate = Montage.create(TextInput, {
});

InputDate.addAttributes( /** @lends module:"montage/ui/input-date.reel".InputDate# */{

/**
	The upper bound for the element’s value represented in the "full-date" format, (for example, 2001-05-24).
	@type {string}
	@default: null
*/
    max: null,
/**
	The lower bound for the element’s value represented in the "full-date" format, (for example, 2001-05-24).
	@type {string}
	@default: null
*/
    min: null,

/**
	The amount the date changes with each step.
	@type {string|number}
	@default null
*/
    step: null
});