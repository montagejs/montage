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

var STRING_CLASS = '[object String]';
var _toString = Object.prototype.toString;
var isString = function(object) {
    return _toString.call(object) === STRING_CLASS;
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
            this._elementSet();
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
        value: function(aName) {
            var value, instance = this;
            // walk up the prototype chain from the instance to NativeControl's prototype
            while(instance && !isUndefined(instance._elementAttributeDescriptors)) {
                value = instance._elementAttributeDescriptors[aName];
                if(value) {
                    break;
                } else {
                    instance = Object.getPrototypeOf(instance);
                }
            }

            return value;
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
        value: function(props) {
            var i, desc, prop, obj;
            this._elementAttributeDescriptors = props;

            for(prop in props) {
                if(props.hasOwnProperty(prop)) {
                    obj = props[prop];
                    // Make sure that the descriptor is of the correct form.
                    if(obj === null || isString(obj)) {
                        desc = {value: obj, dataType: "string"};
                        props[prop] = desc;
                    } else {
                        desc = obj;
                    }

                    // Only add the internal prop, and getter and setter if
                    // they don't already exist.
                    if(isUndefined(this[prop])) {
                        this.defineAttribute(prop, desc);
                    }
                }
            }
        }
    },

    _elementSet: {
        value: function() {
            // The element is now ready, so we can read the attributes that
            // have been set on it.
            var attrs = this.element.attributes || [];
            var i=0, len = attrs.length, name, value, d, desc;

            for(i=0; i< len; i++) {
                name = attrs[i].name;
                value = attrs[i].value;

                if(isUndefined(this._elementAttributeValues[name])) {
                    this._elementAttributeValues[name] = value;
                    if(isUndefined(this[name]) || this[name] == null) {
                        this[name] = value;
                    }
                }
            }

            // check if this element has textContent
            var textContent = this.element.textContent;
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
            for (d in this._elementAttributeDescriptors) {
                desc = this._elementAttributeDescriptors[d];
                if (this["_"+d] === null && desc !== null && "value" in desc) {
                    this["_"+d] = this._elementAttributeDescriptors[d].value;
                }
            }

        }
    },


    draw: {
        enumerable: false,
        value: function() {
            var el = this.element, desc;

            for(var i in this._elementAttributeValues) {
                if(this._elementAttributeValues.hasOwnProperty(i)) {
                    if(i === 'value') {
                        continue;
                    }
                    var val = this[i];
                    //desc = this._elementAttributeDescriptors[i];
                    desc = this._getElementAttributeDescriptor(i, this);
                    if(desc && desc.dataType === 'boolean') {
                        if(val === true) {
                            el[i] = true;
                            el.setAttribute(i, i.toLowerCase());
                        } else {
                            el[i] = false;
                            el.removeAttribute(i);
                        }
                    } else {
                        if(!isUndefined(val)) {
                            if(i === 'textContent') {
                                el.textContent = val;
                            } else {
                                //https://developer.mozilla.org/en/DOM/element.setAttribute
                                el.setAttribute(i, val);
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
