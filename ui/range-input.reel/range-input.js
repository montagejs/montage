/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
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
            this.addComposer(pressComposer);
            pressComposer.addEventListener("pressstart", this, false);
            pressComposer.addEventListener("press", this, false);
            pressComposer.addEventListener("presscancel", this, false);
        }
    },

    _fireInteractionStartEvent: {
        value: function() {
            var interactionStartEvent = document.createEvent("CustomEvent");
            interactionStartEvent.initCustomEvent("montage_range_interaction_start", true, true, null);
            this.dispatchEvent(interactionStartEvent);
        }
    },

    _fireInteractionEndEvent: {
        value: function() {
            var interactionEndEvent = document.createEvent("CustomEvent");
            interactionEndEvent.initCustomEvent("montage_range_interaction_end", true, true, null);
            this.dispatchEvent(interactionEndEvent);
        }
    },

    handlePressstart: {
        value: function(e) {
            console.log('start value = ', this.value);
            this._fireInteractionStartEvent(e);
        }
    },
    
    handlePress: {
        value: function(e) {
            console.log('end value = ', this.value);
            this._fireInteractionEndEvent(e);
        }
    }

});

RangeInput.addAttributes({
    max: {dataType: 'number'},
    min: {dataType: 'number'},
    step: null // number or 'any'
});
