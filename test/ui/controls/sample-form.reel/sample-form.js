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
        set: function(v) {this._firstName = v; this._evaluateJson();}, 
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
    
    _evaluateJson: {
        value: function() {
            this.json = JSON.stringify({
                firstName: this.firstName,
                lastName: this.lastName,
                email: this.email,
                url: this.url
            });
        }
    },
    
    handleSubmitAction: {
        value: function(e) {
                        
        }
    }

});
