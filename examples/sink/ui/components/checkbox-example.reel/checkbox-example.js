/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.CheckboxExample = Montage.create(Component, {

    data: {
        value: null
    },

    jsonSelectedItems: {
        value: null
    },

    _selectedItems: {value: null},
    selectedItems: {
        get: function(){ return this._selectedItems; },
        set: function(v) {

            this._selectedItems = v;
            this.jsonSelectedItems = JSON.stringify(this._selectedItems||[]);
            console.log('selected items = ', v);
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
