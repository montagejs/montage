/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/slot.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;
/**
 @class module:"montage/ui/slot.reel".Slot
 @extends module:montage/ui/component.Component
 */
exports.Slot = Montage.create(Component, /** @lends module:"montage/ui/slot.reel".Slot# */ {

    hasTemplate: {
        enumerable: false,
        value: false
    },

    didCreate: {
        value: function() {
            this.content = null;
        }
    },

/**
        Description TODO
        @type {Property}
        @default null
    */
    delegate: {
        enumerable: false,
        value: null,
        serializable: true
    },

    _content: {
        value: null
    },

/**
        Description TODO
        @type {Function}
        @default null
    */
    content: {
        enumerable: false,
        get: function() {
            return this._content;
        },
        set: function(value) {
            var element;
            if (value && typeof value.needsDraw !== "undefined") {
                // If the incoming content was a component; make sure it has an element before we say it needs to draw
                if (!value.element) {
                    element = document.createElement("div");
                    element.id = "appendDiv"; // TODO: This should be uniquely generated

                    if (this.delegate && typeof this.delegate.slotElementForComponent === "function") {
                        element = this.delegate.slotElementForComponent(this, value, element);
                    }
                } else {
                    element = value.element;
                }
                // The child component will need to draw; this may trigger a draw for the slot itself
                Object.getPropertyDescriptor(Component, "domContent").set.call(this, element);
                value.setElementWithParentComponent(element, this);
                value.needsDraw = true;
            } else {
                Object.getPropertyDescriptor(Component, "domContent").set.call(this, value);
            }
            this._content = value;
            this.needsDraw = true;
        }
    },

/**
        Description TODO
        @type {Function}
        @default null
    */
    contentDidChange: {
        value: function(newContent, oldContent) {
            if (this.delegate && typeof this.delegate.slotDidSwitchContent === "function") {
                this.delegate.slotDidSwitchContent(this, newContent, (newContent ? newContent.controller : null), oldContent, (oldContent ? oldContent.controller : null));
            }
        }
    }
});
