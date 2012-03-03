/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    TextInput = require("ui/text-input").TextInput,
    ResultsList = require("ui/autocomplete/results-list.reel/results-list").ResultsList,
    ArrayController = require("ui/controller/array-controller").ArrayController,
    Popup = require("ui/popup/popup.reel").Popup,    
    PressComposer = require("ui/composer/press-composer").PressComposer;
    
var KEY_UP = 38, 
    KEY_DOWN = 40,
    KEY_RIGHT = 39,
    KEY_ENTER = 13,
    KEY_ESC = 27; 
/**
 * The Autocomplete input
 */
var Autocomplete = exports.Autocomplete = Montage.create(TextInput, {
    
    /**
        The base URL for the auto suggest query. The entered text is passed in as <url>?q=<entered text>
    */
    url: {
        value: null
    },
    
    delegate: {
        value: null
    },
    
    multiple: {
        value: null
    },
    
    // Used if multiple = true
    separator: {
        value: ',',
        distinct: true
    },
    
    delay: {
        value: null
    },
    
    
    /**
    * Number of characters the user must type before the suggest query is fired
    * Default = 2
    */
    minLength: {
        value: 2,
        distinct: true
    },
    
    // width of the popup 
    overlayWidth: {
        value: null
    },
    
    // overridden here to get the substring/searchString
    value: {
        get: function() {
            return this._value;
        },
        set: function(newValue, fromInput) {
            Object.getPropertyDescriptor(TextInput, "value").set.call(this, newValue, fromInput);
            // get the entered text after the separator
            var value = this._value;
            if(fromInput) {
                if(value) {
                    var index = value.lastIndexOf(this.separator);
                    this.searchTerm = value.substring(index);
                } else {
                    this.searchTerm = null;
                }
                
            }
        }
    },
    
    _searchTerm: {value: null},
    searchTerm: {
        get: function() {
            return this._searchTerm;
        },
        set: function(value) {
            if(value !== this._searchTerm) {
                this._searchTerm = value;
                this.performSearch(); 
                if(this._searchTerm) {
                    this.activeItemIndex = null;
                    this.popup.show(); 
                } else {
                    this.popup.hide();
                }            
            }            
        }
    },
    
    // -> resultsController.selectedIndexes
    _activeIndexes: {value: null},
    activeItemIndex: {
        get: function() {
            if(this._activeIndexes && this._activeIndexes.length > 0) {
                return this._activeIndexes[0];
            }
            return null;
        },
        set: function(value) {
            if(value == null) {
                this._activeIndexes = [];
            } else {
                this._activeIndexes = [value];
            }
            
        }
    },
    
    suggestedValue: {
        value: null
    },
    
    // private    
    
    popup: {
        value: null
    },
    
    // the delegate should set the suggestions. 
    // suggestions -> resultsController.objects
    suggestions: {
        value: null
    },
    
    // resultsController -> resultsList.contentController
    resultsController: {
        value: null
    },
    
    // repetition
    resultsList: {
        value: null
    },
    
    // --------
    
    performSearch: {
        value: function() {
            if(this.delegate) {
                // delegate must set the results on the AutoComplete                
                var fn = this.identifier + 'ShouldGetSuggestions';
                if(typeof this.delegate[fn] === 'function') {
                    this.delegate[fn](this, this.searchTerm);
                } else if(typeof this.delegate.shouldGetSuggestions === 'function') {
                    this.delegate.shouldGetSuggestions(this, this.searchTerm);
                } else {
                    // error - d
                }
            }
        }
    },
    
    selectSuggestedValue: {
        value: function() {
            if(this.suggestedValue) {
                this.value = this.suggestedValue;
                if(this.popup.displayed) {
                    this.popup.hide();
                }
            }            
        }
    },
    
    _addEventListeners: {
        value: function() {
            if (window.Touch) {
                //this.element.ownerDocument.addEventListener('touchstart', this, false);
            } else {
                this.element.addEventListener("keyup", this);
                this.element.addEventListener("keydown", this);
                this.element.addEventListener("input", this);
            }
        }
    },

    _removeEventListeners: {
        value: function() {
            if (window.Touch) {
                //this.element.ownerDocument.removeEventListener('touchstart', this, false);
            } else {
                this.element.removeEventListener("keyup", this);
                this.element.removeEventListener("keydown", this);
                this.element.removeEventListener("input", this);
            }
        }
    },
    
    _getPopup: {
        value: function() {
            var popup = this.popup;
            
            if(!popup) {
                popup = Popup.create();
                popup.content = this.resultsList;
                popup.anchor = this.element;  
                // dont let the popup take away the focus
                // we need the focus on the textfield
                popup.focusOnShow = false;
                this.popup = popup;
            }
            return this.popup;
            
        }
    },
    
    prepareForDraw: {
        enumerable: false,
        value: function() {            
            this._addEventListeners();            
                        
            // create the Repetition for the suggestions
            this.resultsController = ArrayController.create();
            Object.defineBinding(this.resultsController, "content", {
                boundObject: this,
                boundObjectPropertyPath: "suggestions",
                oneway: true
            });
            Object.defineBinding(this.resultsController, "selectedIndexes", {
                boundObject: this,
                boundObjectPropertyPath: "_activeIndexes",
                oneway: true
            });
            Object.defineBinding(this, "suggestedValue", {
                boundObject: this.resultsController,
                boundObjectPropertyPath: "selectedObjects.0",
                oneway: true
            });
            
            this.resultsList = ResultsList.create();
            Object.defineBinding(this.resultsList, "contentController", {
                boundObject: this,
                boundObjectPropertyPath: "resultsController",
                oneway: true
            });
            
            var popup = this._getPopup();
        }
    },

    prepareForActivationEvents: {
        value: function() {
            // add pressComposer to handle the claimPointer related work
            var pressComposer = PressComposer.create();
            this.addComposer(pressComposer);
        }
    },

    
    draw: {
        value: function() {            
            var el = this.element;

            var fn = Object.getPrototypeOf(Autocomplete).draw;
            fn.call(this);
        }
    },
    
    
    handleKeyup: {
        enumerable: false,
        value: function(e) {
            var code = e.keyCode, popup = this._getPopup();
            
            switch(code) {
                case KEY_DOWN: 
                if(popup.displayed == false) {
                    popup.show(); 
                    this.activeItemIndex = 0;                   
                } else {
                    this.activeItemIndex++;
                }
                
                break;
                
                case KEY_UP: 
                if(popup.displayed == true) {
                    this.activeItemIndex --;
                    if(this.activeItemIndex < 0) {
                        this.activeItemIndex = 0;
                    }                   
                }
                
                break;
                
                case KEY_ENTER:
                if(popup.displayed == true) {
                    this.selectSuggestedValue();
                }
                
                break;
                
            }
            this.element.focus();
        }
    },
    
    handleKeydown: {
        enumerable: false,
        value: function(event) {
            var code = event.keyCode;
        }
    }
    
});

