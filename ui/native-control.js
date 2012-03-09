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
    }
});

//http://www.w3.org/TR/html5/elements.html#global-attributes
NativeControl.addAttributes({
    accesskey: null,
    contenteditable: null, // true, false, inherit
    contextmenu: null,
    'class': null,
    dir: null,
    draggable: null,
    dropzone: null, // copy/move/link
    hidden: {dataType: 'boolean'},
    //id: null,
    lang: null,
    spellcheck: null,
    style: null,
    tabindex: null,
    title: null
});
