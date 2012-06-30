/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
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
