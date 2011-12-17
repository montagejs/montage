/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    FormField = require("ui/form/form-field").FormField;
/**
 * The Number component. Wraps input type="Number"
 */
exports.Number = Montage.create(FormField, {
    
    _attrs: {
        value: ['min', 'max', 'step']
    },
    
    _max: {value: 100},
    max: {
        serializable: true,
        enumerable: true,
        set: function(v) {
            if(v && v !== this._max) {
                this._max = v;
                this.needsDraw = true;
            }
        },
        get: function() {
            return this._max;
        }
    },
    
    _min: {value: 0},
    min: {
        serializable: true,
        enumerable: true,
        set: function(v) {
            if(v && v !== this._min) {
                this._min = v;
                this.needsDraw = true;
            }
        },
        get: function() {
            return this._min;
        }
    },
    
    _step: {value: null},
    step: {
        serializable: true,
        enumerable: true,
        set: function(v) {
            if(v && v !== this._step) {
                this._step = v;
                this.needsDraw = true;
            }
        },
        get: function() {
            return this._step;
        }
    }

});
