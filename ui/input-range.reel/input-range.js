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
    @module "montage/ui/input-range.reel"
*/
/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    dom = require("ui/dom");

/**
 * The input type="range" field
 * @class module:"montage/ui/input-range.reel".InputRange
 * @extends module:"montage/ui/native/input-range.reel".InputRange
 */
var InputRange = exports.InputRange = Montage.create(Component, /** @lends module:"montage/ui/input-range.reel".InputRange */  {

    // public API
    _min: {
        value: null
    },

    min: {
        get: function() {
            return this._min;
        },
        set: function(value) {
            this._min =  String.isString(value) ? parseFloat(value) : value;
            this.needsDraw = true;
        }
    },

    _max: {
        value: null
    },

    max: {
        get: function() {
            return this._max;
        },
        set: function(value) {
            this._max = String.isString(value) ? parseFloat(value) : value;
            this.needsDraw = true;
        }
   },

    _step: {
        value: null
    },

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
    _width: {
        value: null
    },

    width: {
        get: function() {
            return this._width;
        },
        set: function(value) {
            this._width =  String.isString(value) ? parseFloat(value) : value;
            this.needsDraw = true;
        }
    },

    percent: {
        value: null
    },

    _valueSyncedWithPosition: {
        value: null
    },

    _value: {
        value: null
    },

    value: {
        get: function() {
            return this._value;
        },
        set: function(value, fromInput) {
            this._value =  String.isString(value) ? parseFloat(value) : value;
            //console.log('value set', this._value);
            if(fromInput) {
                this._valueSyncedWithPosition = true;
            } else {
                this._valueSyncedWithPosition = false;
                this.needsDraw = true;
            }
        }
    },

    // private
    _handleEl: {
        value: null
    },

    _translateComposer: {
        value: null
    },

    _sliderWidth: {
        value: null
    },

    __positionX: {
        value: null
    },

    _positionX: {
        get: function() {
            return this.__positionX;
        },
        set: function(value, fromValue) {
            //console.log('positionX', value);
            if(value !== null && !isNaN(value)) {
                this.__positionX = value;
                if(!fromValue) {
                    this._calculateValueFromPosition();
                }
                this.needsDraw = true;
            }
        }
    },

    _touchOnHandle: {value: null},

    __clickTarget: {value: null},
    _clickTarget: {
        get: function() {
            return this.__clickTarget;
        },
        set: function(value) {
            this.__clickTarget = value;
            this.needsDraw = true;
        }
    },

    _handleWidth: {value: null},

    _calculateValueFromPosition: {
        value: function() {
            if(this._sliderWidth > 0) {
                var percent = this.percent = (this._positionX / this._sliderWidth) * 100;
                var value = (this.min + ((percent/100) * (this.max - this.min)));
                Object.getPropertyDescriptor(this, "value").set.call(this, value, true);
                this._valueSyncedWithPosition = true;
            }

        }
    },

    _calculatePositionFromValue: {
        value: function() {
            // unless the element is ready, we cannot position the handle
            if(this._sliderWidth) {
                var percent, value = this.value;
                var range = (this.max - this.min);
                percent = ((this.value-this.min)/range) * 100;
                var positionX = (percent/100)*this._sliderWidth;
                Object.getPropertyDescriptor(this, "_positionX").set.call(this, positionX, true);

                this.percent = percent;
                this._valueSyncedWithPosition = true;
            } else {
                this._valueSyncedWithPosition = false;
            }
        }
    },

    prepareForDraw: {
        value: function() {
            // read initial values from the input type=range
            this.min = this.min || this.element.getAttribute('min') || 0;
            this.max = this.max || this.element.getAttribute('max') || 100;
            this.step = this.step || this.element.getAttribute('step') || 1;
            this.value = this.value || this.element.getAttribute('value') || 0;
        }
    },

    // @todo: Without prepareForActivationEvents, the _translateComposer does not work
    prepareForActivationEvents: {
        value: function() {
            this._translateComposer.addEventListener('translateStart', this, false);
            this._translateComposer.addEventListener('translate', this, false);
            this._translateComposer.addEventListener('translateEnd', this, false);
            this._addEventListeners();
        }
    },

    _addEventListeners: {
        value: function() {
            // support touching the scale to select only in Desktop
            if(window.Touch) {
                this.element.addEventListener('touchstart', this, false);
            } else {
                this.element.addEventListener('mousedown', this, false);
            }
            this._touchOnHandle = false;

        }
    },

    _removeEventListeners: {
        value: function() {
            // support touching the scale to select only in Desktop
            if(window.Touch) {
                this.element.removeEventListener('touchstart', this, false);
            } else {
                this.element.removeEventListener('mousedown', this, false);
            }
        }
    },

    _startTranslateX: {
        enumerable: false,
        value: null
    },

    _startPositionX: {
        enumerable: false,
        value: null
    },

    handleTranslateStart: {
        value: function(e) {
            this._startTranslateX = e.translateX;
            this._startPositionX = this.__positionX;
            this._removeEventListeners();
            this._valueSyncedWithPosition = false;
        }
    },

    handleTranslate: {
        value: function (event) {
            // handle translate on Touch devices only if initial touch was on the knob/handle
            if(!window.Touch || (window.Touch && this._touchOnHandle)) {
                var x = this._startPositionX + event.translateX - this._startTranslateX;
                if (x < 0) {
                    x = 0;
                } else {
                    if (x > this._sliderWidth) {
                        x = this._sliderWidth;
                    }
                }
                this._positionX = x;
            }
        }
    },

    handleTranslateEnd: {
        value: function(e) {
            this._addEventListeners();
        }
    },

    handleMousedown: {
        value: function(e) {
            this._clickTarget = {x: e.pageX, y: e.pageY};
        }
    },

    handleTouchstart: {
        value: function(e) {
            var target = e.targetTouches[0];
            // handle the translate only if touch target is the knob
            this._touchOnHandle = (target.target === this._handleEl);
        }
    },

    surrenderPointer: {
        value: function(pointer, composer) {
            // If the user is sliding us then we do not want anyone using
            // the pointer
            return false;
        }
    },

    willDraw: {
        value: function() {
            this._handleWidth = this._handleEl.offsetWidth;
            this._sliderWidth = this.element.offsetWidth - this._handleWidth;
            if(this._clickTarget) {
                // the slider scale was clicked
                var x = dom.convertPointFromNodeToPage(this.element).x;
                var positionX = (this._clickTarget.x - (x + (this._handleWidth/2)));
                if(positionX < 0) {
                    positionX = 0;
                }
                this._positionX = positionX;
                this._clickTarget = null;
            }
            if(!this._valueSyncedWithPosition) {
                this._calculatePositionFromValue();
            }
        }
    },

    draw: {
        value: function() {
            var el = this._handleEl;
            if(el.style.webkitTransform != null) {
                // detection for webkitTransform to use Hardware acceleration where available
                el.style.webkitTransform = 'translate3d(' + this._positionX + 'px,0,0)';
            } else if(el.style.MozTransform != null) {
                el.style.MozTransform = 'translate3d(' + this._positionX + 'px,0,0)';
            } else if(el.style.transform != null) {
                el.style.transform = 'translate3d(' + this._positionX + 'px,0,0)';
            } else {
                // fallback
                el.style['left'] = this._positionX + 'px';
            }

        }
    }
});
