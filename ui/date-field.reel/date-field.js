/**
    @module "montage/ui/native/input-date.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires montage/ui/text-input
*/
var TextInput = require("ui/text-input").TextInput;

/**
  	Wraps an &lt;input type="date"> element as a component.
    @class module:"montage/ui/native/input-date.reel".InputDate
    @extends module:montage/ui/text-input.TextInput
 */
var DateField = exports.DateField = TextInput.specialize({
    hasTemplate: {value: false }
});

DateField.addAttributes( /** @lends module:"montage/ui/native/input-date.reel".InputDate# */{

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
