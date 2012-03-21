/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    TextInput = require("ui/text-input").TextInput,
    PressComposer = require("ui/composer/press-composer").PressComposer;

/**
 * The input type="range" field
 */
var RangeInput = exports.RangeInput = Montage.create(TextInput, {
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

RangeInput.addAttributes({
    max: {dataType: 'number'},
    min: {dataType: 'number'},
    step: null // number or 'any'
});
