/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;    

/**
 * The input type="range" field
 */
var RangeInput = exports.RangeInput = Montage.create(Component, {
    
    DEFAULT_WIDTH: {value: 300},
    HANDLE_ADJUST: {value: 5},

    hasTemplate: {value: true},

    // public API
    _min: {value: null},
    min: {
        get: function() {
            return this._min;
        },
        set: function(value) {
            this._min =  String.isString(value) ? parseFloat(value) : value;
            this.needsDraw = true;
        }
    },

    _max: {value: null},
    max: {
       get: function() {
           return this._max;
       },
       set: function(value) {
           this._max = String.isString(value) ? parseFloat(value) : value;
           this.needsDraw = true;
       }
   },

    _step: {value: null},
    step: {
       get: function() {
           return this._step;
       },
       set: function(value) {
           this._step =  String.isString(value) ? parseFloat(value) : value;
           this.needsDraw = true;
       }
   },
   
   /** Width of the slider in px. Default = 300 */
   _width: {value: null},
   width: {
         get: function() {
             return this._width;
         },
         set: function(value) {
             this._width =  String.isString(value) ? parseFloat(value) : value;
             this.needsDraw = true;
         }
     },
   

   _sliding: {value: false},
   
   percent: {value: null},
   _valueSyncedWithPosition: {value: null},
   _value: {value: null},
    value: {
       get: function() {
           return this._value;
       },
       set: function(value, fromInput) {
           this._value =  String.isString(value) ? parseFloat(value) : value;

           if(fromInput) {
               this._valueSyncedWithPosition = true;
           } else {
               this._valueSyncedWithPosition = false;
               this._calculatePositionFromValue();
               this.needsDraw = true;
           }
       }
   },

    // private
    sliderEl: {value: null, enumerable: false},
    handleEl: {value: null, enumerable: false},
    sliderLeft: {value: null, enumerable: false},
    sliderWidth: {value: null, enumerable: false},
    minX: {value: null, enumerable: false},
    maxX: {value: null, enumerable: false},

    _positionX: {value: null},
    positionX: {
        enumerable: false,
        get: function() {
            return this._positionX;
        },
        set: function(value, fromValue) {
            
            if(value !== null && !isNaN(value)) {
                this._positionX = value;
                if(!fromValue) {
                    this._calculateValueFromPosition();
                    this._valueSyncedWithPosition = true;
                }  
                this.needsDraw = true;                
            }
           
        }
    },

    _calculateValueFromPosition: {
        value: function() {
            if(this.sliderWidth > 0) {
                var percent = this.percent = (this.positionX / this.sliderWidth) * 100;
                var value = (this.min + ((percent/100) * (this.max - this.min)));               
                Object.getPropertyDescriptor(this, "value").set.call(this, value, true);    
            }

        }
    },
    
    _calculatePositionFromValue: {
        value: function() {
            // unless the element is ready, we cannot position the handle
            if(this.sliderWidth) {
                var percent, value = this.value;
                var range = (this.max - this.min);
                percent = ((this.value-this.min)/range) * 100;                                    
                var positionX = (percent/100)*this.sliderWidth;
                Object.getPropertyDescriptor(this, "positionX").set.call(this, positionX, true);   
                this.percent = percent;
                this._valueSyncedWithPosition = true;             
            } else {
                this._valueSyncedWithPosition = false;
            }            
        }
    },

    deserializedFromTemplate: {
        value: function() {
            
            // read initial values from the input type=range                      
            
            this.min = this.min || this.element.getAttribute('min') || 0;
            this.max = this.max || this.element.getAttribute('max') || 100;            
            this.step = this.step || this.element.getAttribute('step') || 1;
            this.value = this.value || this.element.getAttribute('value') || 0;
            
                        
        }
    },

    prepareForDraw: {
        value: function() {
            this.minX = this.sliderLeft = this.element.offsetLeft;
            this.sliderWidth =  (this.width || RangeInput.DEFAULT_WIDTH); //this.element.offsetWidth || 300;            
            this.element.style.width = (this.sliderWidth + RangeInput.HANDLE_ADJUST) + 'px';
            
            this.maxX = this.sliderLeft + this.sliderWidth;
            
            if(!this._valueSyncedWithPosition) {
                this._calculatePositionFromValue();
            }
        }
    },

    // @todo: Without prepareForActivationEvents, the translateComposer does not work
    prepareForActivationEvents: {
        value: function() {
            this.translateComposer.addEventListener('translateStart', this, false);
            this.translateComposer.addEventListener('translateEnd', this, false);
        }
    },
    
    handleTranslateStart: {
        value: function(e) {
            this._valueSyncedWithPosition = false;
            this._sliding = true;
        }
    },

    handleTranslateEnd: {
        value: function(e) {
            
            if(this._sliding === true) {
                this._sliding = false;
            } else {
                // do this only when the user clicks the slider directly instead of
                // sliding the handle
                var position = this.translateComposer._pointerX;
                var positionX = ((position)- this.sliderLeft);
                if(positionX > 0 && (positionX <= this.sliderWidth)) {
                    this.positionX = positionX;                
                }
                
            }
                        
        }
    },


    surrenderPointer: {
        value: function(pointer, composer) {
            // If the user is sliding us then we do not want anyone using
            // the pointer
            return false;
        }
    },


    draw: {
        value: function() {
            var el = this.handleEl;            
            
            if(el.style.webkitTransform != null) {
                // detection for webkitTransform to use Hardware acceleration where available
                el.style.webkitTransform = 'translate(' + this.positionX + 'px)';
            } else if(el.style.MozTransform != null) {
                el.style.MozTransform = 'translate(' + this.positionX + 'px)';
            } else if(el.style.transform != null) {
                el.style.transform = 'translate(' + this.positionX + 'px)';
            } else {
                // fallback
                el.style['left'] = this.positionX + 'px';                
            }
        }
    }
});
