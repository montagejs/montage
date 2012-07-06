/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

var Montage = require("montage/core/core").Montage;
var Component = require("montage/ui/component").Component;

exports.NativeInputRangeExample = Montage.create(Component, {

    _red: {
        value: 125
    },

    _green: {
        value: 125
    },

    _blue: {
        value: 125
    },

    _opacity: {
        value: 1.0
    },

    colorchip: {
        value: null
    },

    red: {
        get: function() {
            return this._red;
        },
        set: function(value) {
            this._red = Math.round(value);
            this.needsDraw = true;
        }
    },

    blue: {
        get: function() {
            return this._blue;
        },
        set: function(value) {
            this._blue = Math.round(value);
            this.needsDraw = true;
        }
    },

    green: {
        get: function() {
            return this._green;
        },
        set: function(value) {
            this._green = Math.round(value);
            this.needsDraw = true;
        }
    },

    opacity: {
        get: function() {
            return this._opacity;
        },
        set: function(value) {
            this._opacity = value;
            this.needsDraw = true;
        }
    },

    prepareForDraw: {
        value: function() {
            // Prettify code examples
            prettyPrint();
        }
    },


    draw: {
        value: function() {
            this.colorchip.style.background = "rgb(" + this.red + "," + this.green + ", " + this.blue + ")";
            this.colorchip.style.opacity = this.opacity;
            console.log(this.colorchip.style.background);
        }
    },

    logger: {
        value: null
    }

});
