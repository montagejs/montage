/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

exports.ResultsList = Montage.create(Component, {
    
    // contentController -> this.repetition.contentController
    contentController: {value: null},
    
    activeIndexes: {value: null},
    
    _deck: {value: null},
    deck: {
        get: function() {
            return this._deck;
        },
        set: function(v) {
            console.log('setting deck ', v);
            this._deck = v;
            this.needsDraw = true;
        }
    },
    
    _loadingStatus: {value: null},
    loadingStatus: {
        get: function() {
            return this._loadingStatus;
        },
        set: function(status) {
            console.log('setting new status ', status);
            this._loadingStatus = status;
            //this.needsDraw = true;  
            if(this.deck) {
                this.showCardForStatus();
            }        
            
        }
    },
    
    showCardForStatus: {
        value: function() {
            if('complete' == this.loadingStatus) {                
                this.deck.switchValue = 'results';                
            } else {
                this.deck.switchValue = 'loading';
            }
        }
    },
    
    
    draw: {
        value: function() {
            console.log('results list draw: ', this.loadingStatus);
            
        }
        
    }


});
