/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
	@module "montage/ui/dynamic-text.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
 @class module:"montage/ui/dynamic-text.reel".DynamicText
 @extends module:montage/ui/component.Component
 */
exports.DynamicText = Montage.create(Component, /** @lends module:"montage/ui/dynamic-text.reel".DynamicText# */ {

    hasTemplate: {
        value: false
    },
/**
  Description TODO
  @private
*/
    _value: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    value: {
        get: function() {
            return this._value;
        },
        set: function(value) {
            if (this._value !== value) {
                this.needsDraw = true;
            }
            this._value = value;
        },
        serializable: true
    },
/**
        The Montage converted used to convert or format values displayed by this DynamicText instance.
        @type {Property}
        @default null
    */
    converter: {
        value: null
    },
/**
        The default string value assigned to the DynamicText instance.
        @type {Property}
        @default {String} ""
    */
    defaultValue: {
        value: ""
    },

    /**
     @private
     */
    _valueNode: {
        value: null,
        enumerable: false
    },

    prepareForDraw: {
        value: function() {
            this._element.innerHTML = "";
            if (!this._element.firstChild) {
                this._element.appendChild(document.createTextNode(""));
            }
            this._valueNode = this._element.firstChild;
        }
    },


    draw: {
        value: function() {
            var displayValue = (this.value || 0 === this.value ) ? this._value : this.defaultValue;

            if (this.converter) {
                displayValue = this.converter.convert(displayValue);
            }
            this._valueNode.data = displayValue;
        }
    }

});
