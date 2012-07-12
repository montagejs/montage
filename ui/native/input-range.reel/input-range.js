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
/*global require,exports */

/**
    @module "montage/ui/native/input-range.reel"
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
   @class module:"montage/ui/native/input-range.reel".InputRange
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

InputRange.addAttributes( /** @lends module:"montage/ui/native/input-range.reel".InputRange# */ {
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
