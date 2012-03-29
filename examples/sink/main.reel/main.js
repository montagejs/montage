/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Main = Montage.create(Component, {
    content: {value: null},
    sidebar: {value: null},

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
        }
    },

    prepareForDraw: {
        value: function() {
            console.log("main prepareForDraw");

            // routing logic
            this.content.hash = window.location.hash;
            var self = this;
            window.onhashchange = function(event) {
                event.preventDefault();
                self.content.hash = window.location.hash;
            };
        }
    },

    draw: {
        value: function() {
            console.log('main draw');
        }
    },

    didDraw: {
        value: function() {
            console.log('main didDraw');

        }
    }

});
