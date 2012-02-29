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
            var szn, dszr, e, entry, szn_pre;

            dszr = this._template._deserializer;
            szn = JSON.parse(dszr._serializationString);


            for (e in szn) {
                entry = szn[e];
                szn_pre = this.element.querySelector('pre[data-serialization-entry="'+e+'"]');
                if (szn_pre) {
                    szn_pre.innerHTML = '"'+e+'": ' + JSON.stringify(entry, null, "    ");
                }
            }

            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
    },

    log: {
        value: function(msg) {
            this.logger.log(msg);
        }
    },

    handleButton1Action: {
        value: function() {
            this.log("Button - button1 - clicked");
            console.log(this.log);
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
    },

    handleSettingsAction: {
        value: function() {
            this.log("Setting button clicked");
        }
    }
});
