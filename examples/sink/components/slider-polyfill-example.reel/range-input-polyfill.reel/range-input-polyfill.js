/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;    

/**
 * The input type="range" field
 */
var RangeInputPolyfill = exports.RangeInputPolyfill = Montage.create(Component, {

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
            console.log('translateX = ' + value);
            if(value && !isNaN(value)) {
                this._positionX = value;
                if(!fromValue) {
                    this._calculateValue();
                } 
                this.needsDraw = true;                
            }
           
        }
    },

    _calculateValue: {
        value: function() {
            if(this.sliderWidth > 0) {
                var percent = (this.positionX / this.sliderWidth) * 100;
                console.log('percent = ' + percent);
                var value = (this.min + ((percent/100) * (this.max - this.min)));
                console.log('value = ' + value);
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
                console.log('calculated position = ' + positionX);
                Object.getPropertyDescriptor(this, "positionX").set.call(this, positionX, true);                
            }
            // @todo - handle scenario where value is intially set but we are unable to position the 
            // handle as sliderWidth is not available
             
        }
    },

    deserializedFromTemplate: {
        value: function() {
            
            // read initial values from the input type=range  
                    
            /*
            this.min = this.min || this.element.getAttribute('min') || 0;
            this.max = this.max || this.element.getAttribute('max') || 100;            
            this.step = this.step || this.element.getAttribute('step') || 1;
            this.value = this.value || this.element.getAttribute('value') || 0;
            */
            
        }
    },

    prepareForDraw: {
        value: function() {
            this.minX = this.sliderLeft = this.sliderEl.offsetLeft;
            this.sliderWidth = this.sliderEl.offsetWidth; // - (10);
            this.maxX = this.sliderLeft + this.sliderWidth;
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
            console.log('translateStart', e);
        }
    },

    handleTranslateEnd: {
        value: function(e) {
            
            var position = this.translateComposer._pointerX;
            console.log('translateEnd positionX', position);
            
            var positionX = ((position-10)- this.sliderLeft);
            if(positionX > 0 && (positionX <= this.sliderWidth)) {
                this.positionX = positionX;                
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
            this.handleEl.style['left'] = this.positionX + 'px';
        }
    },
    
    didDraw: {
        value: function() {

        }
    }
});
