/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Main = Montage.create(Component, {
    content: {
        value: null
    },

    sidebar: {
        value: null
    },

    // content.selectedItem and sidebar.selectedItem are bound to selectedItem
    _selectedItem: {value: null},
    selectedItem: {
        get: function() {return this._selectedItem;},
        set: function(value) {this._selectedItem = value; this.needsDraw = true;}
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

    _extractItemFromHash: {
        value: function() {
            var hash = window.location.hash;
            if(hash) {
                return hash.substring(hash.indexOf('#')+1);
            }
            return null;
        }
    },

    prepareForDraw: {
        value: function() {
            console.log("main prepareForDraw");

            // routing logic
            this.selectedItem = this._extractItemFromHash();
            var self = this;
            window.onhashchange = function(event) {
                event.preventDefault();
                var hash = window.location.hash;
                if(hash) {
                    self.selectedItem = self._extractItemFromHash(); //window.location.hash;
                }

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
