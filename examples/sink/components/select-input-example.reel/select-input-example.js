/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.SelectInputExample = Montage.create(Component, {
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
    
    _selectedDept: {value: null},
    selectedDept: {
        get: function() {return this._selectedDept;},
        set: function(value) {
            if(this._selectedDept !== value) {
                this._selectedDept = value;                
            }
        }
    },
        
    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            //prettyPrint();
            
            this.firstName = "Foo";
            this.lastName = "Bar";
            
            this.dept.contentController.selectedIndexes = [2];
            
        }
    },
    
    handleUpdateAction: {
        value: function(event) {
            this.json = JSON.stringify({
                firstName: this.firstName,
                lastName: this.lastName,
                country: this.selectedCountry,
                state: this.selectedState,
                department: this.selectedDept             
            });
        }
    }
});
