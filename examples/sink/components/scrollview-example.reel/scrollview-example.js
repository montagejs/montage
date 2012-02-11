/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.ScrollviewExample = Montage.create(Component, {
    json: {value: null},

    firstName: {value: null},
    lastName: {value: null},
    email: {value: null},
    password: {value: null},
    phone: {value: null},
    url: {value: null},
    zip: {value: null},
    dob: {value: null},

    phoneReadOnly: {value: null},
    
    json: {value: null},

    firstName: {value: null},
    lastName: {value: null},

    departments: {
        value: [
            {name: 'Please select a Department', code: ''},
            {name: 'Human Resources', code: 'HRD'},
            {name: 'Software Engineering', code: 'SWE'},
            {name: 'Hardware Engineering', code: 'HWE'},
            {name: 'Finance', code: 'FIN'},
            {name: 'Information Technology', code: 'IT'}
        ]
    },

    dept: {value: null},

    states: {
        value: {
            'USA': [
                {name: 'Arizona', code: 'AZ'},
                {name: 'Colorado', code: 'CO'},
                {name: 'California', code: 'CA'},
                {name: 'New York', code: 'NY'},
                {name: 'Washington', code: 'WA'}
            ],
            'INR': [
                {name: 'Kerala', code: 'KL'},
                {name: 'Karnataka', code: 'KA'},
                {name: 'Tamil Nadu', code: 'TN'},
                {name: 'Andhra Pradesh', code: 'AP'},
                {name: 'Goa', code: 'GO'}
            ]
        }
    },

    _selectedCountry: {value: null},
    selectedCountry: {
        get: function() {return this._selectedCountry;},
        set: function(value) {
            if(value && this._selectedCountry !== value) {
                this._selectedCountry = value;
                // update states list
                var code = this._selectedCountry.value;
                this.statesController.content = this.states[code];
                // select the first option in the States dropdown
                this.statesController.selectedIndexes = [0];
            }
        }
    },

    _selectedState: {value: null},
    selectedState: {
        get: function() {return this._selectedState;},
        set: function(value) {
            if(this._selectedState !== value) {
                this._selectedState = value;
            }
        }
    },

    _selectedDepts: {value: null},
    selectedDepts: {
        get: function() {return this._selectedDepts;},
        set: function(value) {
            this._selectedDepts = (value || []);
        }
    },


    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            //prettyPrint();

            this.firstName = "Foo";
            this.lastName = "Bar";
            this.email = "foo.bar@mycompany.com";
            this.zip = "94087";
            this.url = "http://www.mycompany.com";
            this.dob = new Date(Date.now());

            this.phoneReadOnly = true;
            
            this.dept.contentController.selectedIndexes = [2, 4, 5];
        }
    },

    handleUpdateAction: {
        value: function(event) {
            
            this.json = JSON.stringify({
                firstName: this.firstName,
                lastName: this.lastName,
                email: this.email,
                phone: this.phone,
                url: this.url,
                zip: this.zip,
                dob: this.dob,
                country: this.selectedCountry,
                state: this.selectedState,
                departments: this.selectedDepts

            });
            
        }
    },

    handleEditPhoneAction: {
        value: function(event) {
            this.phoneReadOnly = false;
        }
    }
});
