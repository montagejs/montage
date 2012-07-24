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
    // 'horizontal' (default) or 'vertical'
    orientation: {
        value: null
    },

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

    percent: {
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
            if(fromInput) {
                this._valueSyncedWithPosition = true;
            } else {
                this._valueSyncedWithPosition = false;
                this.needsDraw = true;
            }
        }
    },

    // private
    _valueSyncedWithPosition: {
        value: null
    },

    _knobEl: {
        value: null
    },

    _knobSize: {
        value: null
    },

    _translateComposer: {
        value: null
    },

    _scaleSize: {
        value: null
    },

    __position: {
        value: null
    },

    // position of the center of the knob
    _position: {
        get: function() {
            return this.__position;
        },
        set: function(position, fromValue) {
            if(position !== null && !isNaN(position)) {
                // position = position of Knob. But not the center of the knob
                var threshold = (this._scaleSize - this._knobSize);
                if(position < 0) {
                    position = 0;
                } else if(position > threshold) {
                    position = threshold;
                }

                this.__position = position;
                if(!fromValue) {
                    this._calculateValueFromPosition();
                }
                this.needsDraw = true;
            }
        }
    },

    // true if a touch was detected on the knob
    _touchOnHandle: {value: null},

    // position on the scale where a click was detected
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

    _startTranslate: {
        enumerable: false,
        value: null
    },

    _startPosition: {
        enumerable: false,
        value: null
    },

    // ----- Private methods

    _calculateValueFromPosition: {
        value: function() {
            var scaleSize = this._scaleSize;
            var threshold = (this._scaleSize - this._knobSize);
            var isVertical = (this.orientation === 'vertical');

            if(scaleSize > 0) {
                this.percent = (isVertical ? ((threshold-this._position)/threshold) : (this._position/threshold)) * 100;
                var value = (this.min + ((this.percent/100) * (this.max - this.min)));
                //console.log('percent , value', this.percent, value);
                Object.getPropertyDescriptor(this, "value").set.call(this, value, true);
                this._valueSyncedWithPosition = true;
            }

        }
    },

    _calculatePositionFromValue: {
        value: function() {
            // unless the element is ready, we cannot position the handle
            var isVertical = (this.orientation === 'vertical');
            var scaleSize = this._scaleSize;
            var threshold = (this._scaleSize - this._knobSize);

            if(scaleSize) {
                var percent, value = this.value;
                var range = (this.max - this.min);
                percent = ((this.value-this.min)/range) * 100;
                this.percent = percent;

                var position = (isVertical ? ((100-percent)/100) : (percent/100)) * threshold;
                Object.getPropertyDescriptor(this, "_position").set.call(this, position, true);
                this._valueSyncedWithPosition = true;
            } else {
                this._valueSyncedWithPosition = false;
            }
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

    // ---- Montage Component Callbacks

    prepareForDraw: {
        value: function() {
            // read initial values from the input type=range
            this.min = this.min || this.element.getAttribute('min') || 0;
            this.max = this.max || this.element.getAttribute('max') || 100;
            this.step = this.step || this.element.getAttribute('step') || 1;
            this.value = this.value || this.element.getAttribute('value') || 0;

            this._translateComposer.axis = this.orientation || 'horizontal';
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


    surrenderPointer: {
        value: function(pointer, composer) {
            // If the user is sliding us then we do not want anyone using
            // the pointer
            return false;
        }
    },

    willDraw: {
        value: function() {
            var isVertical = (this.orientation === 'vertical');
            this._knobEl.classList.add(isVertical ? 'vertical' : 'horizontal');
            if(!this._knobSize) {
                this._knobSize = this._knobEl.offsetWidth;
            }
            this.element.classList.add(isVertical ? 'vertical' : 'horizontal');

            if(!this.scaleSize) {
                this._scaleSize = (isVertical ? this.element.offsetHeight : this.element.offsetWidth);
            }

            if(this._clickTarget) {
                // the slider scale was clicked
                var pt = dom.convertPointFromNodeToPage(this.element);
                var coordinate = (isVertical ? pt.y : pt.x);

                var pos = (this._clickTarget[isVertical ? 'y' : 'x'] - (coordinate) - (this._knobSize/2));
                if(pos < 0) {
                    pos = 0;
                }
                this._position = pos;
                this._clickTarget = null;
            }
            if(!this._valueSyncedWithPosition) {
                this._calculatePositionFromValue();
            }
        }
    },

    draw: {
        value: function() {
            var el = this._knobEl;
            var isVertical = (this.orientation === 'vertical');

            var transformValue = this.orientation === 'vertical' ?
            'translate3d(0,' + this._position + 'px,0)':
            'translate3d(' + this._position + 'px,0,0)';

            //console.log("inputRange draw value, percent = ", this.value, this.percent);

            if(el.style.webkitTransform != null) {
                // detection for webkitTransform to use Hardware acceleration where available
                el.style.webkitTransform = transformValue;
            } else if(el.style.MozTransform != null) {
                el.style.MozTransform = transformValue;
            } else if(el.style.transform != null) {
                el.style.transform = transformValue;
            } else {
                // fallback
                if(isVertical) {
                    el.style['top'] = this._position + 'px';
                } else {
                    el.style['left'] = this._position + 'px';
                }
            }

        }
    },


    // ------ Event Handlers

    handleTranslateStart: {
        value: function(e) {
            this._startTranslate = (this.orientation === 'vertical' ? e.translateY : e.translateX);
            this._startPosition = this.__position;
            this._removeEventListeners();
            this._valueSyncedWithPosition = false;
        }
    },

    handleTranslate: {
        value: function (event) {
            // handle translate on Touch devices only if initial touch was on the knob/handle
            if(!window.Touch || (window.Touch && this._touchOnHandle)) {
                var isVertical = (this.orientation === 'vertical');
                var position = this._startPosition + event[isVertical ? 'translateY': 'translateX'] - this._startTranslate;
                this._position = position;
            }
        }
    },

    handleTranslateEnd: {
        value: function(e) {
            this._addEventListeners();
        }
    },

    // handle user clicking the slider scale directly instead of moving the knob
    handleMousedown: {
        value: function(e) {
            this._clickTarget = {x: e.pageX, y: e.pageY};
        }
    },

    handleTouchstart: {
        value: function(e) {
            var target = e.targetTouches[0];
            // handle the translate only if touch target is the knob
            this._touchOnHandle = (target.target === this._knobEl);
        }
    }
});
