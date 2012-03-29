/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Content = Montage.create(Component, {
    // the main component
    sandbox: {
        value: null
    },

    contentDeck: {value: null},

    _selectedItem: {value: null},
    selectedItem: {
        serializable: true,
        get: function() {
            return this._selectedItem;
        },
        set: function(value) {
            this._selectedItem = value;
            this.needsDraw = true;
        }
    },

    _hash: {value: null},
    hash: {
        get: function() {
            return this._hash;
        },
        set: function(hash) {
            this._hash = hash;

            if(hash && hash.length > 0 && hash.indexOf('#') == 0) {
                this.selectedItem = hash.substring(hash.indexOf('#')+1);
                this.needsDraw = true;
            }
        }
    },

    slotDidSwitchContent: {
        value: function(substitution, nodeShown, componentShown, nodeHidden, componentHidden) {
            console.log('substitution did switch content');
            if(componentHidden && typeof componentHidden.didBecomeInactiveInSlot === 'function') {
                componentHidden.didBecomeInactiveInSlot();
            }
            if(componentShown && typeof componentShown.didBecomeActiveInSlot === 'function') {
                componentShown.didBecomeActiveInSlot();
            }
        }
    }

});
