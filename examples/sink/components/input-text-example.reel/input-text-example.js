/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.InputTextExample = Montage.create(Component, {
    json: {value: null},

    firstName: {value: null},
    lastName: {value: null},
    email: {value: null},
    password: {value: null},
    phone: {value: null},
    url: {value: null},
    zip: {value: null},
    dob: {value: null},
    // bound to dob Textfield.error
    dobError: {value: null},

    phoneReadOnly: {value: null},

    prepareForDraw: {
        value: function() {

            this.firstName = "Foo";
            this.lastName = "Bar";
            this.email = "foo.bar@mycompany.com";
            this.zip = "94087";
            this.url = "http://www.mycompany.com";
            this.dob = new Date(Date.now());

            this.phoneReadOnly = true;
            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
    },

    handleUpdateAction: {
        value: function(event) {
            var invalids = this.element.querySelectorAll(":invalid") || [];

            if((invalids.length > 0) || this.dobError != null) {
                this.json = 'Please correct the errors and try again';
            } else {
                this.json = JSON.stringify({
                    firstName: this.firstName,
                    lastName: this.lastName,
                    email: this.email,
                    phone: this.phone,
                    url: this.url,
                    zip: this.zip,
                    dob: this.dob

                });
            }
            // dont submit the form
            //event.preventDefault();
        }
    },

    handleEditPhoneAction: {
        value: function(event) {
            this.phoneReadOnly = false;
        }
    },

    logger: {
        value: null,
        serializable: true
    }
});
