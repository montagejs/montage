/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.ValueBasedEffect = Montage.create(Component, {

    enabled: {
        enumerable: false,
        value: false
    },

    defaultValue: {
        enumerable: false,
        value: null
    },

    value: {
        enumerable: false,
        value: 0
    },

    minValue: {
        enumerable: false,
        value: 0
    },

    maxValue: {
        enumerable: false,
        value: 100
    },

    reset: {
        value: function() {
            this.value = this.defaultValue;
        }
    }

});

var Converter = require("montage/core/converter/converter").Converter;

exports.ResetAvailableConverter = Montage.create(Converter, {

    defaultValue: {
        value: null
    },

    convert: {
        value: function(value) {
            if (null == this.defaultValue) {
                return false;
            } else {
                return (value !== this.defaultValue);
            }
        }
    }

});
