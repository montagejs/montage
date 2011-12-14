/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.ButtonExample = Montage.create(Component, {

    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
    },

    log: {
        value: function(msg) {
            this.logger.innerHTML = this.logger.innerHTML + "<br/>" + msg;
        }
    },

    clearLog: {
        value: function() {
            this.logger.innerHTML = "";
        }
    },

    handleButton1Action: {
        value: function() {
            this.log("Button - button1 - clicked");
        }
    },

    handleButton3Action: {
        value: function() {
            this.log("Cancel Button clicked");
        }
    },

    handleAction: {
        value: function() {
            this.log("Fallback action handler invoked as there is no specific handler for this button");
        }
    }
});
