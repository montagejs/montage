/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    PressComposer = require("ui/composer/press-composer").PressComposer;

exports.TokenField = Montage.create(Component, {
    
    
    delegate: {value: null},
    
    tokens: {value: null},
    
    
    // private
    _hasFocus: {value: null},
    hasFocus: {
        get: function() {
            return this._hasFocus;
        },
        set: function(value) {
            if(value != this._hasFocus) {
                this._hasFocus = value;
                this.needsDraw = true;
            }
        }
    },
    
    tokensController: {value: null},
    tokenList: {value: null, enumerable: false},
    autocomplete: {value: null, enumerable: false},
    
    _pressComposer: {
        enumberable: false,
        value: null
    },
    
    _suggestedValue: {value: null},
    suggestedValue: {
        get: function() {
            return this._suggestedValue;
        },
        set: function(newValue) {
            if(this._suggestedValue !== newValue) {
                this._suggestedValue = newValue;
                if(!this.tokens) {
                    this.tokens = [];
                }
                this.tokens.push(this._suggestedValue);
                this.autocomplete.value = '';
            }
        }
    },
    
    didCreate: {
        value: function() {
            this._pressComposer = PressComposer.create();
            this.addComposer(this._pressComposer);
        }
    },
    
    prepareForActivationEvents: {
        value: function() {
            this._pressComposer.addEventListener("pressStart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);
        }
    },
    
    prepareForDraw: {
        value: function() {
            this.autocomplete.delegate = this.delegate;
            if(this.identifier) {
                this.autocomplete.identifier = this.identifier;
                this.identifier = 'token-field-' + this.identifier;
            }
        }
    },
    
    draw: {
        value: function() {
            if(this.hasFocus) {
                this.autocomplete.element.focus();
                this.hasFocus = false;
            }
        }
    },
    
    // Event handling
    
    handlePressStart: {
        value: function(event) {
            // @todo - check if the target is a token.
            this.hasFocus = true;
        }
    }
    


});
