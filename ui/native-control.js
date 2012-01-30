/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

var isUndefined = function(obj) {
   return (typeof obj === 'undefined');
};


/**
 * Base component for all native controls.
 */
var NativeControl = exports.NativeControl = Montage.create(Component, {

    hasTemplate: {
        value: false
    },

    element: {
        serializable: true,
        enumerable: true,
        get: function() {
            return this._element;
        },
        set: function(value) {
            //var component = Object.getPrototypeOf(NativeControl);
            // call super set
            Object.getPropertyDescriptor(Component, "element").set.call(this, value);
            this.didSetElement();
        }
    },


    /** Stores values that need to be set on the element. Cleared each draw
     * cycle.
     */
    _elementAttributeValues: {
        value: {},
        distinct: true
    },

    /** Stores the descriptors of the properties that can be set on this
     * control
     */

    _elementAttributeDescriptors: {
       value: {},
       distinct: true
    },


    _getElementAttributeDescriptor: {
        value: function(attributeName) {
            var attributeDescriptor, instance = this;
            // walk up the prototype chain from the instance to NativeControl's prototype
            while(instance && !isUndefined(instance._elementAttributeDescriptors)) {
                attributeDescriptor = instance._elementAttributeDescriptors[attributeName];
                if(attributeDescriptor) {
                    break;
                } else {
                    instance = Object.getPrototypeOf(instance);
                }
            }

            return attributeDescriptor;
        }
    },

    /**
    * Add a property to this Component. A default getter/setter is provided and a
    * "_" property is created by default. Eg: if the property is "title", "_title" is
    * automatically created and the value set to the value from the descriptor.
    */
    defineAttribute: {
        value: function(name, descriptor) {
            descriptor = descriptor || {};

            var newDescriptor = {
                configurable: isUndefined(descriptor.configurable) ? true: descriptor.configurable,
                enumerable: isUndefined(descriptor.enumerable) ?  true: descriptor.enumerable,
                serializable: isUndefined(descriptor.serializable) ? true: descriptor.serializable,
                set: (function(name) {
                    return function(value) {
                        var attrName = '_' + name;

                        var desc = this._getElementAttributeDescriptor(name, this);

                        // if requested dataType is boolean (eg: checked, readonly etc)
                        // coerce the value to boolean
                        if(desc && "boolean" === desc.dataType) {
                            value = ( (value || value === "") ? true : false);
                        }

                        // If the set value is different to the current one,
                        // update it here, and set it to be updated on the
                        // element in the next draw cycle.
                        if(!isUndefined(value) && this[attrName] !== value) {
                            this[attrName] = value;
                            this._elementAttributeValues[name] = value;
                            this.needsDraw = true;
                        }
                    };
                }(name)),
                get: (function(name) {
                    return function() {
                        return this['_' + name];
                    };
                }(name))
            };

            // Define _ property
            Montage.defineProperty(this, '_' + name, {value: null});
            // Define property getter and setter
            Montage.defineProperty(this, name, newDescriptor);
        }
    },

    /**
    * Add the specified properties as properties of this Component
    */
    addAttributes: {
        value: function(properties) {
            var i, descriptor, property, object;
            this._elementAttributeDescriptors = properties;

            for(property in properties) {
                if(properties.hasOwnProperty(property)) {
                    object = properties[property];
                    // Make sure that the descriptor is of the correct form.
                    if(object === null || String.isString(object)) {
                        descriptor = {value: object, dataType: "string"};
                        properties[property] = descriptor;
                    } else {
                        descriptor = object;
                    }

                    // Only add the internal property, and getter and setter if
                    // they don't already exist.
                    if(isUndefined(this[property])) {
                        this.defineAttribute(property, descriptor);
                    }
                }
            }
        }
    },

    didSetElement: {
        value: function() {
            // The element is now ready, so we can read the attributes that
            // have been set on it.
            var attributes = this.element.attributes || [];
            var i=0, length = attributes.length, name, value, attributeName, descriptor, textContent;

            for(i=0; i< length; i++) {
                name = attributes[i].name;
                value = attributes[i].value;

                if(isUndefined(this._elementAttributeValues[name])) {
                    this._elementAttributeValues[name] = value;
                    if(isUndefined(this[name]) || this[name] == null) {
                        this[name] = value;
                    }
                }
            }

            // check if this element has textContent
            textContent = this.element.textContent;
            // set textContent only if it is defined as part of element properties
            if(('textContent' in this) && textContent && ("" !== textContent)) {
                if(isUndefined(this._elementAttributeValues['textContent'])) {
                    this._elementAttributeValues['textContent'] = textContent;
                    if(isUndefined(this['textContent']) || this['textContent'] === null) {
                        this['textContent'] = textContent;
                    }
                }
            }

            // Set defaults for any properties that weren't serialised or set
            // as attributes on the element.
            for (attributeName in this._elementAttributeDescriptors) {
                descriptor = this._elementAttributeDescriptors[attributeName];
                if (this["_"+attributeName] === null && descriptor !== null && "value" in descriptor) {
                    this["_"+attributeName] = this._elementAttributeDescriptors[attributeName].value;
                }
            }

        }
    },


    draw: {
        enumerable: false,
        value: function() {
            var element = this.element, descriptor;

            for(var attributeName in this._elementAttributeValues) {
                if(this._elementAttributeValues.hasOwnProperty(attributeName)) {
                    if(attributeName === 'value') {
                        continue;
                    }
                    var value = this[attributeName];
                    descriptor = this._getElementAttributeDescriptor(attributeName, this);
                    if(descriptor && descriptor.dataType === 'boolean') {
                        if(value === true) {
                            element[attributeName] = true;
                            element.setAttribute(attributeName, attributeName.toLowerCase());
                        } else {
                            element[attributeName] = false;
                            element.removeAttribute(attributeName);
                        }
                    } else {
                        if(!isUndefined(value)) {
                            if(attributeName === 'textContent') {
                                element.textContent = value;
                            } else {
                                //https://developer.mozilla.org/en/DOM/element.setAttribute
                                element.setAttribute(attributeName, value);
                            }

                        }
                    }

                }
            }
            // the values have been flushed to the DOM.
            this._elementAttributeValues = {};

        }
    },


    /// Pointer handling

    prepareForActivationEvents: {
        value: function() {
            if (window.Touch) {
                this._element.addEventListener("touchstart", this);
            } else {
                this._element.addEventListener("mousedown", this);
            }
        }
    },

    /**
    @default null
    @private
    */
    _observedPointer: {
        enumerable: false,
        value: null
    },

    _startInteraction: {
        enumerable: false,
        value: function(event) {
            if (event.type === "touchstart") {
                this._observedPointer = event.changedTouches[0].identifier;
                document.addEventListener("touchend", this);
                document.addEventListener("touchcancel", this);
            } else if (event.type === "mousedown") {
                this._observedPointer = "mouse";
                // Needed to cancel action event dispatch is mouseup'd when
                // not on the component
                document.addEventListener("mouseup", this);
                // Needed to preventDefault if another component has claimed
                // the pointer
                document.addEventListener("click", this);
            }

            this.eventManager.claimPointer(this._observedPointer, this);
        }
    },

    /**
    Basic interaction interpreter. Generally should be overridden.

    In overriding function it should be used as follows:
    <code><pre>
    _interpretInteraction: function(event) {
        var isTarget = Object.getPrototypeOf(YOUR_CLASS_NAME)._interpretInteraction.call(this, event, false);
        // Your own code here
        // This example will not end in the interaction when a mouseup is
        // received on the element, so that you can preventDefault when you
        // receive a click.
        if (isTarget && event.type !== "mouseup") {
            this._endInteraction(event);
        } else {
            this._endInteraction(event);
        }

        return isTarget;
    }
    </pre></code>

    @param {Event} event The event that caused this to be called.
    @param {Boolean} [endInteraction=true] Whether _endInteraction should be
        called from this function. Set to false if you want to perform
        additional actions yourself before ending the interaction.
    @returns {Boolean} Whether this component's element was the target of the event.
    */
    _interpretInteraction: {
        value: function(event, endInteraction) {
            if (this._observedPointer === null) {
                this._endInteraction(event);
                return false;
            }

            var target = event.target;
            endInteraction = (endInteraction === false) ? false : true;

            while (target !== this._element && target && target.parentNode) {
                target = target.parentNode;
            }

            if (this._element === target) {
                // preventDefault if another component has claimed the pointer
                if (!this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    event.preventDefault();
                }

                if (endInteraction) {
                    this._endInteraction(event);
                }
                return true;
            }

            if (endInteraction) {
                this._endInteraction(event);
            }
            return false;
        }
    },

    /**
    Remove event listeners after an interaction has finished.


    */
    _endInteraction: {
        value: function(event) {
            if (!event || event.type === "touchend" || event.type === "touchcancel") {
                document.removeEventListener("touchend", this);
                document.removeEventListener("touchcancel", this);
            } else if (!event || event.type === "click" || event.type === "mouseup") {
                document.removeEventListener("click", this);
                document.removeEventListener("mouseup", this);
            }

            if (this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                this.eventManager.forfeitPointer(this._observedPointer, this);
            }
            this._observedPointer = null;
        }
    },

    _changedTouchisObserved: {
        value: function(changedTouches) {
            var i = 0, changedTouchCount = event.changedTouches.length;

            for (; i < changedTouchCount; i++) {
                if (event.changedTouches[i].identifier === this._observedPointer) {
                    return true;
                }
            }
            return false;
        }
    },

    handleTouchstart: {
        value: function(event) {
            this._startInteraction(event);
        }
    },
    handleTouchend: {
        value: function(event) {
            if (this._observedPointer === null) {
                this._endInteraction(event);
                return;
            }

            if (this._changedTouchisObserved(event.changedTouches)) {
                this._interpretInteraction(event);
            }
        }
    },
    handleTouchcancel: {
        value: function(event) {
            if (this._observedPointer === null || this._changedTouchisObserved(event.changedTouches)) {
                this._endInteraction(event);
            }
        }
    },

    handleMousedown: {
        value: function(event) {
            this._startInteraction(event);
        }
    },
    handleClick: {
        value: function(event) {
            this._interpretInteraction(event);
        }
    },
    handleMouseup: {
        value: function(event) {
            this._interpretInteraction(event);
        }
    }
});

//http://www.w3.org/TR/html5/elements.html#global-attributes
NativeControl.addAttributes({
    accesskey: null,
    contenteditable: null, // true, false, inherit
    contextmenu: null,
    'class': null,
    dir: null,
    draggable: {dataType: 'boolean'},
    dropzone: null, // copy/move/link
    hidden: {dataType: 'boolean'},
    //id: null,
    lang: null,
    spellcheck: null,
    style: null,
    tabindex: null,
    title: null
});
