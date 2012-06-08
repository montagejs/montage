/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Main = Montage.create(Component, {

    templateDidLoad: {
        value: function() {
            //console.log("main templateDidLoad")
        }
    },

    prepareForDraw: {
        value: function() {
            //console.log("main prepareForDraw")
        }
    },
    
    log: {
        value: function(msg) {
            this.logger.log(msg);
        }
    },
    
    // Event handling
    
    handleMontageButtonAction: {
        value: function() {
            this.log('Montage button action event');
        }
    },
    handleNativeButtonAction: {
        value: function() {
            this.log('Native button action event');
        }
    }
    

});
