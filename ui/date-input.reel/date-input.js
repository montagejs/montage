/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module "montage/ui/date-input.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires montage/ui/text-input
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    TextInput = require("ui/text-input").TextInput;

/**
  	Wraps an &lt;input type="date"> element as a component.
    @class module:"montage/ui/date-input.reel".DateInput
    @extends module:montage/ui/text-input.TextInput
 */
var DateInput = exports.DateInput = Montage.create(TextInput, {
});

DateInput.addAttributes( /** @lends module:"montage/ui/date-input.reel".DateInput# */{

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
	The value granularity of the element’s value.
	@type {string|number}
	@default null
*/
    step: null
});