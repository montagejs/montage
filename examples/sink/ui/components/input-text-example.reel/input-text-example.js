/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
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
    // bound to dob InputText.error
    dobError: {value: null},

    phoneReadOnly: {value: null},

    prepareForDraw: {
        value: function() {

            this.firstName = "Foo";
            this.lastName = "Bar";
            this.password = "12345";
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
                    password: this.password,
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
        value: null
    }
});
