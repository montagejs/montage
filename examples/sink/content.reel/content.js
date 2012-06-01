/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Notifier = require("montage/ui/popup/notifier.reel/notifier").Notifier;

exports.Content = Montage.create(Component, {

    contentDeck: {
        value: null,
        serializable: true
    },

    _selectedItem: {value: null},
    selectedItem: {
        serializable: true,
        get: function() {
            return this._selectedItem;
        },
        set: function(value) {
            console.log('set selectedItem ', value, this._selectedItem);
            if(value !== "" && value !== this._selectedItem) {
                this._selectedItem = value;
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
