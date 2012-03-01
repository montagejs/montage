/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.AutocompleteExample = Montage.create(Component, {

    json: {value: null},

    country: {value: null},
    state: {value: null},
    info: {value: null},

    prepareForDraw: {
        value: function() {
            this.country = "Foo";
            this.state = "Bar";
        }
    },

    handleUpdateAction: {
        value: function(event) {
            this.json = JSON.stringify({
                country: this.country,
                state: this.state,
                info: this.info

            });
        }
    }
});
