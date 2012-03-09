/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.SliderPolyfillExample = Montage.create(Component, {

    result: {value: null},
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
    }
});
