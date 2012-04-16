/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    PressComposer = require("ui/composer/press-composer").PressComposer;

var KEY_DELETE = 8,
KEY_BACKSPACE = 8;

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

    autocompleteValue: {value: null},
    autocompleteValue: {
        get: function() {
            return this._autocompleteValue;
        },
        set: function(value) {
            this._autocompleteValue = value;
        }
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
            /*
            this._pressComposer = PressComposer.create();
            this.addComposer(this._pressComposer);
            */

        }
    },

    prepareForActivationEvents: {
        value: function() {
            /*
            this._pressComposer.addEventListener("pressStart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);
            */
            if(window.Touch) {
                this.element.addEventListener('touchup', this);
            } else {
                this.element.addEventListener('mouseup', this);
            }
        }
    },

    prepareForDraw: {
        value: function() {
            this.autocomplete.delegate = this.delegate;
            if(this.identifier) {
                this.autocomplete.identifier = this.identifier;
                this.identifier = 'token-field-' + this.identifier;
            }
            this.autocomplete.element.addEventListener("keyup", this);
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

    handleMouseup: {
        value: function(event) {
            // @todo - check if the target is a token.
            this.hasFocus = true;


        }
    },

    handleKeyup: {
        enumerable: false,
        value: function(e) {
            var code = e.keyCode;
            //console.log('keyCode', code);

            switch(code) {
                // @todo - check Keycode in Windows/Linux/Mobile browsers
                case KEY_BACKSPACE:
                case KEY_DELETE:

                // Only remove the token if the token has already been selected
                // So the behavior is to select the last token if it is not selected already.
                // If selected already, then remove it

                if((!this.autocompleteValue) && this.tokens && this.tokens.length > 0) {
                    var selectedIndexes = this.tokensController.selectedIndexes;
                    // check if the selected token is the last one
                    if(selectedIndexes && selectedIndexes.length > 0 && selectedIndexes[0] === (this.tokens.length-1)) {
                        // removes the selected one
                        this.tokensController.remove();
                    } else {
                        this.tokensController.selectedIndexes = [this.tokens.length-1];
                    }
                }

                break;

            }

        }

    }




});
