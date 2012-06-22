/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    DynamicText = require("ui/dynamic-text.reel").DynamicText;

exports.ResultItem = Montage.create(DynamicText, {
    
    textPropertyPath: {value: null},
    
    _object: {value: null},
    object: {
        get: function() {
            return this._object;
        },
        set: function(aValue) {
            if(aValue) {
               this._object = aValue;                
            }
            if(this._object) {
                if(this.textPropertyPath) {
                    this.value = this._object[this.textPropertyPath];
                } else {
                    this.value = this._object;
                }
            }
        }
    }

});
