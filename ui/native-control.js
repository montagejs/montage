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

/**
    @module montage/ui/native-control
    @requires montage/core/core
    @requires montage/ui/component
*/

var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
    Base component for all native components, such as RadioButton and Checkbox.
    @class module:montage/ui/native-control.NativeControl
    @extends module:montage/ui/component.Component
 */
var NativeControl = exports.NativeControl = Montage.create(Component, /** @lends module:montage/ui/native-control.NativeControl# */ {

    hasTemplate: {
        value: false
    },

/**
    The HTML element associated with the NativeControl instance.
    @type {element}
    @default null
*/
    element: {
        get: function() {
            return this._element;
        },
        set: function(value) {
            Object.getPropertyDescriptor(Component, "element").set.call(this, value);

            if (value) {
                this.didSetElement();
            }
        }
    },


    /**
        Stores values that need to be set on the element. Cleared each draw cycle.
        @private
     */
    _elementAttributeValues: {
        value: {},
        distinct: true
    },

    /**
        Stores the descriptors of the properties that can be set on this control
        @private
     */
    _elementAttributeDescriptors: {
       value: {},
       distinct: true
    },


    _getElementAttributeDescriptor: {
        value: function(attributeName) {
            var attributeDescriptor, instance = this;
            // walk up the prototype chain from the instance to NativeControl's prototype
            while(instance && (typeof instance._elementAttributeDescriptors !== 'undefined')) {
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
    * Adds a property to the component with the specified name. This method is used internally by the framework convert a DOM element's standard attributes into bindable properties. It creates an accessor property (getter/setter) with the same name as the specified property, as well as a "backing" data property whose name is prepended with an underscore (_). The backing variable is assigned the value from the property descriptor. For example, if the name  "title" is passed as the first parameter, a "title" accessor property is created as well a data property named "_title".
    * @function
    * @param {String} name The property name to add.
    * @param {Object} descriptor An object that specifies the new properties default attributes such as configurable and enumerable.
    */
    defineAttribute: {
        value: function(name, descriptor) {
            descriptor = descriptor || {};
            var _name = '_' + name;


            var newDescriptor = {
                configurable: (typeof descriptor.configurable == 'undefined') ? true: descriptor.configurable,
                enumerable: (typeof descriptor.enumerable == 'undefined') ?  true: descriptor.enumerable,
                set: (function(name, attrName) {
                    return function(value) {
                        var desc = this._getElementAttributeDescriptor(name, this);

                        // if requested dataType is boolean (eg: checked, readonly etc)
                        // coerce the value to boolean
                        if(desc && "boolean" === desc.dataType) {
                            value = ( (value || value === "") ? true : false);
                        }

                        // If the set value is different to the current one,
                        // update it here, and set it to be updated on the
                        // element in the next draw cycle.
                        if((typeof value !== 'undefined') && this[attrName] !== value) {
                            this[attrName] = value;
                            this._elementAttributeValues[name] = value;
                            this.needsDraw = true;
                        }
                    };
                }(name, _name)),
                get: (function(name, attrName) {
                    return function() {
                        return this[attrName];
                    };
                }(name, _name))
            };

            // Define _ property
            Montage.defineProperty(this, _name, {value: null});
            // Define property getter and setter
            Montage.defineProperty(this, name, newDescriptor);
        }
    },

    /**
    * Add the specified properties as properties of this component.
    * @function
    * @param {object} properties An object that contains the properties you want to add.
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
                    if(typeof this[property] == 'undefined') {
                        this.defineAttribute(property, descriptor);
                    }
                }
            }
        }
    },

// callbacks

    didSetElement: {
        value: function() {
            // The element is now ready, so we can read the attributes that
            // have been set on it.
            var attributes = this.element.attributes || [];
            var i=0, length = attributes.length, name, value, attributeName, descriptor, textContent;

            for(i=0; i< length; i++) {
                name = attributes[i].name;
                value = attributes[i].value;

                descriptor = this._getElementAttributeDescriptor(name, this);
                // check if this attribute from the markup is a well-defined attribute of the component
                if(descriptor || (typeof this[name] !== 'undefined')) {
                    // only set the value if a value has not already been set by binding
                    if(typeof this._elementAttributeValues[name] == 'undefined') {
                        this._elementAttributeValues[name] = value;
                        if( (typeof this[name] == 'undefined') || this[name] == null) {
                            this[name] = value;
                        }
                    }
                }
            }

            // check if this element has textContent
            textContent = this.element.textContent;
            // set textContent only if it is defined as part of element properties
            if(('textContent' in this) && textContent && ("" !== textContent)) {
                if(typeof this._elementAttributeValues['textContent'] == 'undefined') {
                    this._elementAttributeValues['textContent'] = textContent;
                    if( (typeof this['textContent'] == 'undefined') || this['textContent'] === null) {
                        this['textContent'] = textContent;
                    }
                }
            }

            // Set defaults for any properties that weren't serialised or set
            // as attributes on the element.
            for (attributeName in this._elementAttributeDescriptors) {
                descriptor = this._elementAttributeDescriptors[attributeName];
                var _name = "_"+attributeName;
                if (this[_name] === null && descriptor !== null && "value" in descriptor) {
                    this[_name] = this._elementAttributeDescriptors[attributeName].value;
                }
            }
            this.needsDraw = true;
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
                    if(descriptor) {

                        if(descriptor.dataType === 'boolean') {
                            if(value === true) {
                                element[attributeName] = true;
                                element.setAttribute(attributeName, attributeName.toLowerCase());
                            } else {
                                element[attributeName] = false;
                                element.removeAttribute(attributeName);
                            }
                        } else {
                            if(typeof value !== 'undefined') {
                                if(attributeName === 'textContent') {
                                    element.textContent = value;
                                } else {
                                    //https://developer.mozilla.org/en/DOM/element.setAttribute
                                    element.setAttribute(attributeName, value);
                                }

                            }
                        }

                    }

                    delete this._elementAttributeValues[attributeName];
                }
            }
        }
    }
});

//http://www.w3.org/TR/html5/elements.html#global-attributes
NativeControl.addAttributes( /** @lends module:montage/ui/native-control.NativeControl# */ {

/**
    Specifies the shortcut key(s) that gives focuses to or activates the element.
    @see {@link http://www.w3.org/TR/html5/editing.html#the-accesskey-attribute}
    @type {string}
    @default null
*/
    accesskey: null,

/**
    Specifies if the content is editable or not. Valid values are "true", "false", and "inherit".
    @see {@link http://www.w3.org/TR/html5/editing.html#contenteditable}
    @type {string}
    @default null

*/
    contenteditable: null,

/**
    Specifies the ID of a <code>menu</code> element in the DOM to use as the element's context menu.
    @see  {@link http://www.w3.org/TR/html5/interactive-elements.html#attr-contextmenu}
    @type {string}
    @default null
*/
    contextmenu: null,

/**
    A space separated list of CSS classes to apply to the element.
    @see {@link http://www.w3.org/TR/html5/elements.html#classes}
    @type {string}
    @default null
*/
    'class': null,

/**
    Specifies the elements element's text directionality. Valid values are "ltr", "rtl", and "auto".
    @see {@link http://www.w3.org/TR/html5/elements.html#the-dir-attribute}
    @type {string}
    @default null
*/
    dir: null,

/**
    Specifies if the element is draggable. Valid values are "true", "false", and "auto".
    @type {string}
    @default null
    @see {@link http://www.w3.org/TR/html5/dnd.html#the-draggable-attribute}
*/
    draggable: null,

/**
    Specifies the behavior that's taken when an item is dropped on the element. Valid values are "copy", "move", and "link".
    @type {string}
    @see {@link http://www.w3.org/TR/html5/dnd.html#the-dropzone-attribute}
*/
    dropzone: null,

/**
    When specified on an element, it indicates that the element should not be displayed.
    @type {boolean}
    @default false
*/
    hidden: {dataType: 'boolean'},
    //id: null,

/**
    Specifies the primary language for the element's contents and for any of the element's attributes that contain text.
    @type {string}
    @default null
    @see {@link http://www.w3.org/TR/html5/elements.html#attr-lang}
*/
    lang: null,

/**
    Specifies if element should have its spelling and grammar checked by the browser. Valid values are "true", "false".
    @type {string}
    @default null
    @see {@link http://www.w3.org/TR/html5/editing.html#attr-spellcheck}
*/
    spellcheck: null,

/**
    The CSS styling attribute.
    @type {string}
    @default null
    @see {@link http://www.w3.org/TR/html5/elements.html#the-style-attribute}
*/
    style: null,

/**
     Specifies the relative order of the element for the purposes of sequential focus navigation.
     @type {number}
     @default null
     @see {@link http://www.w3.org/TR/html5/editing.html#attr-tabindex}
*/
    tabindex: null,

/**
    Specifies advisory information about the element, used as a tooltip when hovering over the element, and other purposes.
    @type {string}
    @default null
    @see {@link http://www.w3.org/TR/html5/elements.html#the-title-attribute}
*/
    title: null
});
