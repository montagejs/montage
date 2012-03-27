/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module "montage/ui/number-input.reel"
    @requires montage/ui/component
    @requires montage/ui/text-input
*/

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    TextInput = require("ui/text-input").TextInput;

/**
 * Wraps the a &lt;input type="date"> element with binding support for the element's standard attributes.
   @class module:"montage/ui/number-input.reel".NumberInput
   @extends module:montage/text-input.TextInput
 */
var NumberInput = exports.NumberInput = Montage.create(TextInput, {

});

NumberInput.addAttributes(/** @lends module:"montage/ui/number-input.reel".NumberInput */{

/**
	The maximum value displayed but the number control.
	@type {number}
	@default null
*/
    max: {dataType: 'number'},

/**
	The minimum value displayed but the number control.
	@type {number}
	@default null
*/
    min: {dataType: 'number'},

/**
	The amount the number changes with each step.
	@type {number}
	@default null
*/
    step: null // number or 'any'
});
