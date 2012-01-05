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

var extend = function(destination, source) {
  for (var property in source) destination[property] = source[property];
  return destination;
};

var STRING_CLASS = '[object String]';
var _toString = Object.prototype.toString;
var isString = function(object) {
    return _toString.call(object) === STRING_CLASS;
};
    
/**
 * Mixin for Component to handle native HTML components
 */
exports.NativeControl = Montage.create(Component, {
    
    hasTemplate: {value: false},
    
    //http://www.w3.org/TR/html5/elements.html#global-attributes
    _baseElementProperties: {
        value: {
            accesskey: {},
            'class': {},
            title: {},
            style: {}
        }        
    },

    _elementAttributeValues: {
        value: {},
        distinct: true
    },
    
    // the initial set of property descriptors that was used
    _propertyDescriptors: {
       value: {},
       distinct: true
    },
        
    /**
    * Add a property to this Component. A default getter/setter is provided and a 
    * "_" property is created by default. Eg: if the property is "title", "_title" is 
    * automatically created and the value set to the value from the descriptor.
    */    
    addProperty: {
        value: function(name, descriptor) {
            descriptor = descriptor || {};
            
            var value = null;
            if(!isUndefined(descriptor.value)) {
                value = descriptor.value;
                delete descriptor.value;
            }
            
            Montage.defineProperty(this, '_' + name, {value: value});
            
            var newDescriptor = {
                configurable: isUndefined(descriptor.configurable) ? true: descriptor.configurable,
                enumerable: isUndefined(descriptor.enumerable) ?  true: descriptor.enumerable,
                serializable: isUndefined(descriptor.serializable) ? true: descriptor.serializable,                
                set: function(n) {                    
                    return function(val) {
                       var attrName = '_' + n;
                       
                       var desc = this._propertyDescriptors[n];
                       // if requested dataType is boolean (eg: checked, readonly etc)
                       // coerce the value to boolean
                       if(desc && "boolean" === desc.dataType) {
                           //val = !!val;
                           val = (val == null || isUndefined(val)? false : true);
                       }
                       
                       if(!isUndefined(val) && this[attrName] !== val) {
                           this[attrName] = val;
                           this._elementAttributeValues[n] = val;
                           this.needsDraw = true;
                       }                                 
                    }; 
                }(name),
                get: function(n) {
                    return function() {
                        return this['_' + n];
                    };
                }(name)
            };
            
            
            Montage.defineProperty(this, name, newDescriptor);  
            
                                  
        }
    },
    
    /**
    * Add the specified properties as properties of this Component
    */
    addProperties: {
        value: function(props) {
            var i, desc, prop, obj;
            var stdAttrs = {};
            stdAttrs = extend(stdAttrs, this._baseElementProperties); 
            stdAttrs = extend(stdAttrs, props); 
            
            this._propertyDescriptors = stdAttrs;
            
            for(prop in stdAttrs) {
                if(stdAttrs.hasOwnProperty(prop)) {
                    if(isUndefined(this[prop])) {                        
                        obj = stdAttrs[prop];
                        if(obj == null || isString(obj)) {
                            desc = {value: obj};
                        } else {
                            desc = obj;
                        }
                        this.addProperty(prop, desc);
                    } 
                           
                }
            } 
        }
    },
    
    deserializedFromTemplate: {
        value: function() {            
            
            var attrs = this.element.attributes || [];
            var i=0, len = attrs.length, name, value;
            
            for(i=0; i< len; i++) {
                name = attrs[i].name;
                value = attrs[i].value;

                if(isUndefined(this._elementAttributeValues[name])) {
                    this._elementAttributeValues[name] = value;   
                    // since deserializedFromTemplate is called *after* the initial binding
                    // is done, override the values only if a value does not already exist
                    if(isUndefined(this[name]) || this[name] === null) {
                        this[name] = value;  
                    }
                                    
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
                    desc = this._propertyDescriptors[i];
                    if(desc && desc.dataType === 'boolean') {
                        if(val === true) {
                            el.setAttribute(i);
                        } else {
                            el.removeAttribute(i);
                        }
                    } else {
                        if(!isUndefined(val) && val !== null) {
                            //https://developer.mozilla.org/en/DOM/element.setAttribute
                            el.setAttribute(i, val);
                        }
                    }
                                     
                }
            }
            // the values have been flushed to the DOM. 
            this._elementAttributeValues = {};
            
        }
    }
});
