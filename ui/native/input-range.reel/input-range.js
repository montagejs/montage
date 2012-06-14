/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports */

/**
    @module "montage/ui/input-range.reel"
    @requires montage/ui/component
    @requires montage/ui/text-input
    @requires montage/ui/composer/press-composer
*/

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    TextInput = require("ui/text-input").TextInput,
    PressComposer = require("ui/composer/press-composer").PressComposer;

/**
 * Wraps the a &lt;input type="range"> element with binding support for the element's standard attributes.
   @class module:"montage/ui/input-range.reel".InputRange
   @extends module:montage/ui/text-input.TextInput
 */
var InputRange = exports.InputRange = Montage.create(TextInput, {
    prepareForActivationEvents: {
        value: function() {
            var pressComposer = PressComposer.create();
            pressComposer.delegate = this;
            this.addComposer(pressComposer);
            pressComposer.addEventListener("pressStart", this, false);
            pressComposer.addEventListener("press", this, false);
            pressComposer.addEventListener("pressCancel", this, false);
        }
    },

    handlePressStart: {
        value: function(e) {
            var interactionStartEvent = document.createEvent("CustomEvent");
            interactionStartEvent.initCustomEvent("montage_range_interaction_start", true, true, null);
            this.dispatchEvent(interactionStartEvent);
        }
    },

    handlePress: {
        value: function(e) {
            var interactionEndEvent = document.createEvent("CustomEvent");
            interactionEndEvent.initCustomEvent("montage_range_interaction_end", true, true, null);
            this.dispatchEvent(interactionEndEvent);
        }
    },

    surrenderPointer: {
        value: function(pointer, composer) {
            // If the user is sliding us then we do not want anyone using
            // the pointer
            return false;
        }
    }
});

InputRange.addAttributes( /** @lends module:"montage/ui/input-range.reel".InputRange# */ {
/**
    The maximum value displayed but the input control.
    @type {number}
    @default null
*/
    max: {dataType: 'number'},

/**
    The minimum value displayed but the input control.
    @type {number}
    @default null
*/
    min: {dataType: 'number'},

/**
    The amount the number changes with each step. The step size can be a number, or the string 'any'.
    @type {number|string}
    @default null
*/
    step: null // number or 'any'
});
