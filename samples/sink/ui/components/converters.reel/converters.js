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
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Converter = require("montage/core/converter/converter").Converter;

exports.Converters = Montage.create(Component, {

    _number: {
        value: 9990
    },

    inputNumber: {
        get: function() {
            return this._number;
        },
        set: function(v) {
            this._number = v;
        }
    },

    _date: {
        value: new Date(Date.now())
    },

    inputDate: {
        get: function() {
            return this._date;
        },
        set: function(v) {
            this._date = v;
        }
    },
    $number: {
        value: null
    },
    num1Cmp: {
        value: null
    },
    num2Cmp: {
        value: null
    },
    num2Cmp: {
        value: null
    },
    num3Cmp: {
        value: null
    },
    num4Cmp: {
        value: null
    },
    currencyCmp: {
        value: null
    },

    applyNumberFormat: {
        value: function(evt) {
            var value = this.$number.value;

            this.num1Cmp.value = value;
            this.num2Cmp.value = value;
            this.num3Cmp.value = value;
            this.num4Cmp.value = value;

        }
    },

    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
    },

    logger: {
        value: null
    }

});

/* Custom converter to convert from Celsius to Fahrenheit and vice-versa */
exports.TempConverter = Montage.create(Converter, {

    allowPartialConversion: {
        value: true
    },

    // convert fahrenheit to celsius (showing our non-metric heritage here)
    convert: {
        value: function(value) {
            value = parseInt(value, 10);
            if(!isNaN(value)) {
                return ((value - 32) / 1.8).toFixed(2);
            }
            return null;
        }
    },

    // revert celsius to fahrenheit
    revert: {
        value: function(value) {
            value = parseInt(value, 10);
            if(!isNaN(value)) {
                return ((1.8 * value) + 32).toFixed(2);
            }
            return null;
        }
    }

});
