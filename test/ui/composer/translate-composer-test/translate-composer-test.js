/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;

var TranslateComposerTest = exports.TranslateComposerTest = Montage.create(Montage, {
    // _example: {
    //     value: null
    // },
    // example: {
    //     get: function() {
    //         return this._example;
    //     },
    //     set: function(value) {
    //         this._example = value;
    //     }
    // },

    x: {
        get: function() {
            return this.example.element.style.left;
        },
        set: function(value) {
            this.example.element.style.left = value + "px";
        }
    },

    y: {
        get: function() {
            return this.example.element.style.top;
        },
        set: function(value) {
            this.example.element.style.top = value + "px";
        }
    },

    handleTranslate: {
        value: function(event) {
        }
    }
});