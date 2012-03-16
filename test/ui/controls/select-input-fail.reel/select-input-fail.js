/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Converter = require("montage/core/converter/converter").Converter;
    
    
exports.JustifyConverter = Montage.create(Converter, {
    justify: {value: null},
    
    convert: {
        value: function(value) {
            return (value === this.justify);
        }
    },

    revert: {
        value: function(value) {
            return (value === true ? this.justify : "");
        }
    }
});

exports.SelectInputFail = Montage.create(Component, {
    
    
    _justify: {value: null},
    justify: {
        get: function() {
            return this._justify;
        },
        set: function(value) {
            this._justify = value;
            console.log('JUSTIFY - ', value);
        }
    },
    
    prepareForDraw: {
        value: function() {
            this.justify = "center";

        }
    }
});
