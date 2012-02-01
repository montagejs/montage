/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.TextareaExample = Montage.create(Component, {

    json: {value: null},

    firstName: {value: null},
    lastName: {value: null},
    info: {value: null},

    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            //prettyPrint();

            this.firstName = "Foo";
            this.lastName = "Bar";


            this.phoneReadOnly = true;
        }
    },

    handleUpdateAction: {
        value: function(event) {
            this.json = JSON.stringify({
                firstName: this.firstName,
                lastName: this.lastName,
                info: this.info

            });
        }
    }
});
