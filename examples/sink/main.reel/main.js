/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Main = Montage.create(Component, {
    _selectedItem: {value: null},
    selectedItem: {
        get: function() {return this._selectedItem;},
        set: function(value) {this._selectedItem = value;}
    },

    templateDidLoad: {
        value: function() {
            console.log("main templateDidLoad");
        }
    },

    deserializedFromTemplate: {
        value: function() {
            console.log("main deserializedFromTemplate");
            //console.log('context = ' + window.location.hash);
        }
    },

    prepareForDraw: {
        value: function() {
            console.log("main prepareForDraw");

        }
    }

});
