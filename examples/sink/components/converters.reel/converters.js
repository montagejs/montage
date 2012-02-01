/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Converter = require("montage/core/converter/converter").Converter;

exports.Converters = Montage.create(Component, {

    _number: {
        value: 9990.09
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

    deserializedFromTemplate: {
        enumerable: false,
        value: function() {
            this.$number = document.querySelector('#txt-number');
            this.$currencyValue = document.querySelector('#txt-cur-value');
        }
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

    applyCurrencyFormat: {
        value: function() {
            var value = this.$currencyValue.value;
            this.currencyCmp.value = value;
        }
    },

    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
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
            return (parseInt(value, 10) - 32) / 1.8;
        }
    },

    // revert celsius to fahrenheit
    revert: {
        value: function(value) {
            return (1.8 * parseInt(value, 10)) + 32;
        }
    }

});

var InvertConverter = exports.InvertConverter = Montage.create(Converter, {
    /**
     Specifies whether the converter allows partial conversion.
     @type {Property}
     @default {Boolean} true
     */
    allowPartialConversion: {
        value: true
    },

    convert: {
        enumerable: false,
        value: function(v) {
            return !v;
        }
    },

    revert: {
        value: function(v) {
            return !v;
        }
    }
});
