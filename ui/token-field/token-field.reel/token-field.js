/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
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

    delegate: {value: null, serializable: true},

    values: {value: null, serializable: true},

    /**
    * Path to a String within an Object that is representative of the Object
    */
    textPropertyPath: {value: null, serializable: true},

    /**
    * Allow ad-hoc strings (strings that do not have corresponding represented object) to be entered.
    */
    allowAdHocValues: {value: null, serializable: true},

    placeholder: {value: null, serializable: true},


    // private

    __hasFocus: {value: null},
    _hasFocus: {
        get: function() {
            return this.__hasFocus;
        },
        set: function(value) {
            if(value != this.__hasFocus) {
                this.__hasFocus = value;
                this.needsDraw = true;
            }
        }
    },

    _tokensController: {value: null, serializable: true},
    _tokenList: {value: null, serializable: true},
    _autocomplete: {value: null, serializable: true},
    __autocompleteValue: {value: null},
    _autocompleteValue: {
        serializable: true,
        get: function() {
            return this.__autocompleteValue;
        },
        set: function(value) {
            this.__autocompleteValue = value;
        }
    },

    __suggestedValue: {value: null},
    _suggestedValue: {
        serializable: true,
        get: function() {
            return this.__suggestedValue;
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
                    this.__suggestedValue = representedObject;
                    // able to find a representedObject
                    if(!this.values) {
                        this.values = [];
                    }
                    this.values.push(this.__suggestedValue);
                    this._autocomplete.value = '';
                }
                // nullify the value as autocomplete.value is empty
                this.__suggestedValue = null;

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
            this._autocomplete.delegate = this.delegate;
            if(this.identifier) {
                this._autocomplete.identifier = this.identifier;
                // @todo : this might be a problem. Since delegate methods are prefixed with
                // the identifier
                //this.identifier = 'token-field-' + this.identifier;
            }
            this._autocomplete.element.addEventListener("keyup", this);
        }
    },

    draw: {
        value: function() {
            if(this._hasFocus) {
                this._autocomplete.element.focus();
                this.__hasFocus = false;
            } else {
                if(this.placeholder) {
                    this._autocomplete.element.style.width = 'auto';
                }
            }
        }
    },

    // Event handling
    handleMouseup: {
        value: function(event) {
            this._hasFocus = true;
        }
    },

    handleKeyup: {
        value: function(e) {
            var code = e.keyCode;
            //console.log('keyCode', code);
            if(this.values && this.values.length > 0) {
                var selectedIndexes = this._tokensController.selectedIndexes;
                var selectedIndex = (selectedIndexes && selectedIndexes.length > 0 ? selectedIndexes[0] : null);
                var lastIndex = this.values.length - 1, len = this.values.length;

                switch(code) {
                    // @todo - check Keycode in Windows/Linux/Mobile browsers
                    case KEY_BACKSPACE:
                    case KEY_DELETE:
                    // Only remove the token if the token has already been selected
                    // So the behavior is to select the last token if it is not selected already.
                    // If selected already, then remove it

                    if(!this._autocompleteValue) {
                        // check if the selected token is the last one
                        if(selectedIndexes && selectedIndexes.length > 0) {
                            // removes the selected one
                            this._tokensController.removeObjectsAtSelectedIndexes();
                            this._tokensController.selectedIndexes = [];
                        } else {
                            this._tokensController.selectedIndexes = [this.values.length-1];
                        }
                    }

                    break;

                    case KEY_LEFT:
                        if(!this._autocompleteValue) {
                            if(selectedIndex != null) {
                                selectedIndex = selectedIndex - 1;
                                if(selectedIndex < 0) {
                                    selectedIndex = lastIndex;
                                }
                            } else {
                                selectedIndex = lastIndex;
                            }
                            this._tokensController.selectedIndexes = [selectedIndex];
                        }

                    break;

                    case KEY_RIGHT:
                    if(!this._autocompleteValue) {
                        if(selectedIndex != null) {
                            selectedIndex = selectedIndex + 1;
                            if(selectedIndex > lastIndex) {
                                selectedIndex = 0;
                            }
                        } else {
                            selectedIndex = 0;
                        }
                        this._tokensController.selectedIndexes = [selectedIndex];
                    }

                    break;


                    case KEY_UP:
                        if(selectedIndex != null) {
                            this._tokensController.selectedIndexes = [0];
                        }

                    break;

                    case KEY_DOWN:
                        if(selectedIndex != null) {
                            this._tokensController.selectedIndexes = [lastIndex];
                        }

                    break;


                    default:
                        this._tokensController.selectedIndexes = [];
                    break;

                }
            }

        }

    }




});
