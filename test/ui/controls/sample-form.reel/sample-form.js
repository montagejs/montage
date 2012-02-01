/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.SampleForm = Montage.create(Component, {

    hasTemplate: {value: false},

    json: {value: null},

    _firstName: {value: null},
    firstName: {
        set: function(v) {console.log('firstName = ' + v);this._firstName = v; this._evaluateJson();},
        get: function(){ return this._firstName;}
    },

    _lastName: {value: null},
    lastName: {
        set: function(v) {this._lastName = v; this._evaluateJson();},
        get: function(){ return this._lastName;}
    },

    _email: {value: null},
    email: {
        set: function(v) {this._email = v; this._evaluateJson();},
        get: function(){ return this._email;}
    },

    _url: {value: null},
    url: {
        set: function(v) {this._url = v; this._evaluateJson();},
        get: function(){ return this._url;}
    },

    option1: {
        set: function(v) {
            console.log('option 1', v);
        },
        get: function(){ return false;}
    },
    option2: {
        set: function(v) {
            console.log('option 2', v);
        },
        get: function(){ return this._option2;}
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
            if(this._selectedCountry !== value) {
                this._selectedCountry = value;
                // update states list
                var code = this._selectedCountry.value;
                this.statesController.content = this.states[code];
                // select the first option in the States dropdown
                this.statesController.selectedIndexes = [0];
                this._evaluateJson();
            }
        }
    },

    _selectedState: {value: null},
    selectedState: {
        get: function() {return this._selectedState;},
        set: function(value) {
            if(this._selectedState !== value) {
                this._selectedState = value;
                this._evaluateJson();
            }
        }
    },

    _evaluateJson: {
        value: function() {
            this.json = JSON.stringify({
                firstName: this.firstName,
                lastName: this.lastName,
                email: this.email,
                url: this.url,
                country: this._selectedCountry,
                state: this.selectedState
            });
        }
    },

    prepareForDraw: {
        value: function() {
            // programatically override the maxlength property of the firstName component
            this.fname.maxlength = "10";

            // select a Country programatically
            //this.countries.contentController.selectedIndexes = [2];
        }
    },

    handleSubmitAction: {
        value: function(e) {

        }
    }
});
