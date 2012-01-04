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
exports.ControlMixin = {
    
    _baseElementProperties: {
        value: {
            title: '',
            disabled: {defaultValue: 'false', dataType: 'boolean'},
            'class': ''  
        }        
    },

    _changedProperties: {
        value: {},
        distinct: true
    },
        
    addProperty: {
        value: function(name, descriptor) {
            descriptor = descriptor || {};
            
            var value = null;
            if(!isUndefined(descriptor.value)) {
                value = descriptor.value;
                delete descriptor.value;
            }
            
            Montage.defineProperty(this, '_' + name, {value: value});
            
            descriptor = extend({
                configurable: false,
                enumerable: true,
                serializable: true,
                set: function(n) {                    
                    return function(val) {
                       var attrName = '_' + n;
                       if(val && this[attrName] !== val) {
                           this[attrName] = val;
                           this._changedProperties[n] = val;
                           this.needsDraw = true;
                       }                                 
                    }; 
                }(name),
                get: function(n) {
                    return function() {
                        return this['_' + n];
                    };
                }(name)
            }, descriptor);
            
            
            Montage.defineProperty(this, name, descriptor);  
                                  
        }
    },
    
    addProperties: {
        value: function(props) {
            var i, desc, prop, obj;
            var stdAttrs = {};
            stdAttrs = extend(stdAttrs, this._baseElementProperties); 
            stdAttrs = extend(stdAttrs, props); 
            
            for(prop in stdAttrs) {
                if(stdAttrs.hasOwnProperty(prop)) {
                    if(isUndefined(this[prop])) {                        
                        obj = stdAttrs[prop];
                        if(isString(obj)) {
                            desc = {value: obj};
                        } else {
                            desc = obj;
                        }
                    } 
                    this.addProperty(prop, desc);               
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

                if(!this._changedProperties[name]) {
                    this._changedProperties[name] = value;   
                    // since deserializedFromTemplate is called *after* the initial binding
                    // is done, override the values only if a value does not already exist
                    if(isUndefined(this[name])) {
                        this[name] = value;  
                    }
                                    
                }                                                         
            }                               
        }
    },
    
    
    draw: {
        enumerable: false,
        value: function() {
            var el = this.element;
            
            for(var i in this._changedProperties) {   
                if(this._changedProperties.hasOwnProperty(i)) {
                    if(i === 'value') {
                        continue;
                    }   
                    var val = this[i];              
                    if(!isUndefined(val) && val !== null) {
                        //https://developer.mozilla.org/en/DOM/element.setAttribute
                        el.setAttribute(i, val);
                        //el[i] = val;
                    }                    
                }
            }
            // the values have been flushed to the DOM. 
            this._changedProperties = {};
            
        }
    }
};
