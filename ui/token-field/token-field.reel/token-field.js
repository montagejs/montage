/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

var KEY_DELETE = 46,
KEY_BACKSPACE = 8,
KEY_LEFT = 37,
KEY_UP = 38,
KEY_RIGHT = 39,
KEY_DOWN = 40;

exports.TokenField = Montage.create(Component, {

    delegate: {value: null},

    values: {value: null},

    /**
    * Path to a String within an Object that is representative of the Object
    */
    textPropertyPath: {value: null},

    /**
    * Allow ad-hoc strings (strings that do not have corresponding represented object) to be entered.
    */
    allowAdHocValues: {value: null},

    placeholder: {value: null},


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
            if(newValue) {
                var representedObject;
                if(!this.allowAdHocValues && String.isString(newValue)) {
                    // since ad-hoc values are not allowed, check with the delegate
                    // if a representedObject can be found for this string
                    representedObject = this.callDelegateMethod('getRepresentedObject', newValue);
                } else {
                    representedObject = newValue;
                }
                if(representedObject) {
                    this._suggestedValue = representedObject;
                    // able to find a representedObject
                    if(!this.values) {
                        this.values = [];
                    }
                    this.values.push(this._suggestedValue);
                    this.autocomplete.value = '';
                }

            }
        }
    },

    prepareForActivationEvents: {
        value: function() {
            this.element.addEventListener('mouseup', this);
        }
    },

    prepareForDraw: {
        value: function() {
            this.autocomplete.delegate = this.delegate;
            if(this.identifier) {
                this.autocomplete.identifier = this.identifier;
                // @todo : this might be a problem. Since delegate methods are prefixed with
                // the identifier
                //this.identifier = 'token-field-' + this.identifier;
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
            this.hasFocus = true;
        }
    },

    handleKeyup: {
        enumerable: false,
        value: function(e) {
            var code = e.keyCode;
            //console.log('keyCode', code);
            if(this.values && this.values.length > 0) {
                var selectedIndexes = this.tokensController.selectedIndexes;
                var selectedIndex = (selectedIndexes && selectedIndexes.length > 0 ? selectedIndexes[0] : null);
                var lastIndex = this.values.length - 1, len = this.values.length;

                switch(code) {
                    // @todo - check Keycode in Windows/Linux/Mobile browsers
                    case KEY_BACKSPACE:
                    case KEY_DELETE:
                    // Only remove the token if the token has already been selected
                    // So the behavior is to select the last token if it is not selected already.
                    // If selected already, then remove it

                    if(!this.autocompleteValue) {
                        // check if the selected token is the last one
                        if(selectedIndexes && selectedIndexes.length > 0) {
                            // removes the selected one
                            this.tokensController.remove();
                        } else {
                            this.tokensController.selectedIndexes = [this.values.length-1];
                        }
                    }

                    break;

                    case KEY_LEFT:
                        if(!this.autocompleteValue) {
                            if(selectedIndex != null) {
                                selectedIndex = selectedIndex - 1;
                                if(selectedIndex < 0) {
                                    selectedIndex = lastIndex;
                                }
                            } else {
                                selectedIndex = lastIndex;
                            }
                            this.tokensController.selectedIndexes = [selectedIndex];
                        }

                    break;

                    case KEY_RIGHT:
                    if(!this.autocompleteValue) {
                        if(selectedIndex != null) {
                            selectedIndex = selectedIndex + 1;
                            if(selectedIndex > lastIndex) {
                                selectedIndex = 0;
                            }
                        } else {
                            selectedIndex = 0;
                        }
                        this.tokensController.selectedIndexes = [selectedIndex];
                    }

                    break;

                    case KEY_UP:
                        this.tokensController.selectedIndexes = [0];
                    break;

                    case KEY_DOWN:
                        this.tokensController.selectedIndexes = [lastIndex];
                    break;

                    default:
                        this.tokensController.selectedIndexes = [];
                    break;

                }
            }

        }

    }




});
