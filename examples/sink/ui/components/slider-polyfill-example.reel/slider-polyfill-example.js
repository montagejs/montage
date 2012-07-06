/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.

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
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.SliderPolyfillExample = Montage.create(Component, {

    result: {
        value: null
    },

    resultHex: {value: null},

    _red: {value: null},
    red: {
        set: function(v) {
            this._red = v;
            this._calculateHexValue();
            this.needsDraw = true;
        },
        get: function() {return this._red;}
    },
    _green: {value: null},
    green: {
        set: function(v) {
            this._green = v;
            this._calculateHexValue();
            this.needsDraw = true;},
        get: function() {return this._green;}
    },
    _blue: {value: null},
    blue: {
        set: function(v) {
            this._blue = v;
            this._calculateHexValue();
            this.needsDraw = true;
        },
        get: function() {return this._blue;}
    },


    _calculateHexValue: {
        value: function() {
            var red = this._getHexValue(this.red);
            var green = this._getHexValue(this.green);
            var blue = this._getHexValue(this.blue);
            var rgb = red + '' + green + '' + blue;

            this.resultHex = '#' + rgb;
        }
    },

    _getHexValue: {
        value: function(number) {
            return Math.round(number).toString(16);
        }
    },

    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
    },

    draw: {
        value: function() {

            this.result.style.backgroundColor = this.resultHex;

        }
    },

    handleResetAction: {
        value: function() {
            this.red = 0;
            this.green = 0;
            this.blue = 0;
        }
    },

    logger: {
        value: null
    }
});
