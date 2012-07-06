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
    Component = require("montage/ui/component").Component,
    Converter = require("montage/core/converter/converter").Converter;


exports.JustifyConverter = Montage.create(Converter, {
    justify: {
        value: null
    },

    convert: {
        value: function(value) {
            return (value === this.justify);
        }
    },

    revert: {
        value: function(value) {
            return (value === true ? this.justify : "");
        }
    }
});

exports.SelectInputExample = Montage.create(Component, {
    json: {value: null},

    firstName: {value: null},
    lastName: {value: null},

    statesController: {
        value: null
    },

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

    dept: {
        value: null
    },

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
            if(value) {
                // remove values with empty code
                value = value.filter(function(value, index) {
                    return value.code;
                });
            }
            this._selectedDepts = (value || []);
        }
    },

    _justify: {value: null},
    justify: {
        get: function() {
            return this._justify;
        },
        set: function(value) {
            this._justify = value;
        }
    },



    prepareForDraw: {
        value: function() {

            this.firstName = "John";
            this.lastName = "FooBar";

            this.dept.contentController.selectedIndexes = [2, 4, 5];
            this.justify = "center";

            // invoke pretty-fier
            prettyPrint();
        }
    },

    handleUpdateAction: {
        value: function(event) {
            event.preventDefault();
            this.json = JSON.stringify({
                firstName: this.firstName,
                lastName: this.lastName,
                country: this.selectedCountry,
                state: this.selectedState,
                departments: this.selectedDepts
            });
        }
    },

    logger: {
        value: null
    }
});
