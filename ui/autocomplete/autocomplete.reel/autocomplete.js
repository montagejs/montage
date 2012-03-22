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
        distinct: true,
        value: 1000
    },    
    
    /**
    * Number of characters the user must type before the suggest query is fired
    * Default = 2
    */
    minLength: {
        value: 2,        
        distinct: true
    },
    
    _tokens: {value: null},
    tokens: {
        get: function() {
            return this._tokens;
        },
        set: function(value) {
            this._tokens = value; 
            this.value = this._tokens.join(this.separator);  
            this.needsDraw = true;                
        },
        modify: function(v) {
            this._tokens = v;
        },
        distinct: true
    },
    
    // overridden here to get the substring/searchString
    value: {
        get: function() {
            return this._value;
        },
        set: function(newValue, fromInput) {
            this._value = newValue;
            //Object.getPropertyDescriptor(TextInput, "value").set.call(this, newValue, fromInput);
            
            console.log('setting value - ', newValue, fromInput, this._value);
            
            // get the entered text after the separator
            var value = this._value;
            if(fromInput) {  
                if(value) {
                    var arr = value.split(this.separator).map(function(item) {
                        return item.trim();
                    });
                    this.activeTokenIndex = this._findActiveTokenIndex(this.tokens, arr); 
                    console.log('active token = ', this.activeTokenIndex);
                                       
                    this._tokens = value.split(this.separator).map(function(item) {
                        return item.trim();
                    });
                    
                    if(this._tokens.length && this._tokens.length > 0) {
                        var searchTerm = this._tokens[this.activeTokenIndex];
                        console.log('searchTerm', searchTerm);
                        if(searchTerm && searchTerm.trim() !== '' && searchTerm.length > this.minLength) { 
                            
                            var self = this;
                            if(!this.delayTimer) {
                                this.delayTimer = setTimeout(function() {
                                    self.delayTimer = null;
                                    //if(!self.popup.displayed) {
                                        self.performSearch(searchTerm);
                                    //}
                                    
                                }, this.delay);
                            }
                                                       
                            
                        } else {
                            this.showPopup = false;
                        }                      
                    } else {
                        this.showPopup = false;
                    }
                    
                } else {
                    this.activeTokenIndex = 0;
                    this._tokens = [];
                    this.showPopup = false;
                }
                
            }
            
            if(fromInput) {
                this._valueSyncedWithInputField = true;
            } else {
                this._valueSyncedWithInputField = false;
                this.needsDraw = true;
            }
        }
    },
    
    
    
    //----  Private
    
    // width of the popup 
    overlayWidth: {
        value: null,
        enumerable: false
    },
    
    delayTimer: {
        value: null,
        enumerable: false
    },
    
    // valid values are 'loading', 'complete' and 'timeout'
    // --> ResultList.loadingStatus
    loadingStatus: {
        enumerable: false,
        value: null
    },
    
    // the index of the token in the tokens Array that is being worked on
    activeTokenIndex: {value: null},
    
    /** @private */
    _findActiveTokenIndex: {
        enumerable: false,
        value: function(before, after) {
            if(before == null || after == null) {
                return 0;
            }

            //console.log('before arr', before);
            //console.log('after arr', after);
            
            var i=0, len = after.length;
            for(i=0; i< len; i++) {
                if(i < before.length) {
                    if(before[i] === after[i]) {
                        continue;
                    } else {
                        break;
                    }                    
                }
            }
            return i;
            
        }
    },
    

    // -> resultsController.activeIndexes
    _activeIndexes: {value: null, enumerable: false},
    activeItemIndex: {
        enumerable: false,
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
    
    _suggestedValue: {value: null},
    suggestedValue: {
        distinct: true,
        enumerable: false,
        get: function() {
            return this._suggestedValue;
        },
        set: function(value) {            
            if(value) {
                this._suggestedValue = value;
                var arr = this.tokens; 
                console.log('got suggested value = ', this.suggestedValue);               
                arr[this.activeTokenIndex] = this.suggestedValue;
                console.log('arr after replacing value', arr);
                
                this.tokens = arr;
                this.showPopup = false;
            }
        }
    },
    
    // private    
    
    popup: {
        enumerable: false,
        value: null
    },
    
    _showPopup: {value: null},
    showPopup: {
        enumerable: false,
        get: function() {
            return this._showPopup;
        },
        set: function(value) {
            //if(value !== this._showPopup) {
                this._showPopup = value;
                this.needsDraw = true;
            //}            
        }
    },
    
    // the delegate should set the suggestions. 
    // suggestions -> resultsController.objects
    _suggestions: {value: null},
    suggestions: {
        enumerable: false,
        get: function() {
            return this._suggestions;
        },
        set: function(value) {
            console.log('got suggestions: ', value);            
            this._suggestions = value;
            //this.loadingStatus = 'complete';
            this.loadingStatus = 'complete';
            this.showPopup = (value && value.length > 0);                        
        }
    },
    
    // resultsController -> resultsList.contentController
    resultsController: {
        enumerable: false,
        value: null
    },
    
    // repetition
    resultsList: {
        enumerable: false,
        value: null
    },
        
    performSearch: {
        enumerable: false,
        value: function(searchTerm) {
            if(this.delegate) {
                this.loadingStatus = 'loading';
                this.showPopup = true;
                // delegate must set the results on the AutoComplete                
                var fn = this.identifier + 'ShouldGetSuggestions';
                if(typeof this.delegate[fn] === 'function') {
                    this.delegate[fn](this, searchTerm);
                } else if(typeof this.delegate.shouldGetSuggestions === 'function') {
                    this.delegate.shouldGetSuggestions(this, searchTerm);
                } else {
                    // error - d
                }
            }
        }
    },
    
    
    _addEventListeners: {
        enumerable: false,
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
        enumerable: false,
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
        enumerable: false,
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
        value: function() {            
            this._addEventListeners(); 
            this.delay = this.delay || 500; // default delay           
                        
            // create the Repetition for the suggestions
            this.resultsController = ArrayController.create();
            Object.defineBinding(this.resultsController, "content", {
                boundObject: this,
                boundObjectPropertyPath: "suggestions",
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
            
            Object.defineBinding(this.resultsList, "activeIndexes", {
                boundObject: this,
                boundObjectPropertyPath: "_activeIndexes",
                oneway: true
            });
            
            Object.defineBinding(this.resultsList, "loadingStatus", {
                boundObject: this,
                boundObjectPropertyPath: "loadingStatus",
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
            
            console.log('DRAW called ', this.showPopup);
            
            if(this.showPopup) {
                this.popup.show();
                // reset active index
                this.activeItemIndex = 0;
            } else {
                if(this.popup.displayed) {
                    this.popup.hide();
                }                
            }
            
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
                    var list = this.suggestions || [];
                    if(list.length > 0 && this.activeItemIndex < list.length-1) {
                        this.activeItemIndex++;
                    } else {
                        this.activeItemIndex = 0;
                    }
                    
                }
                
                break;
                
                case KEY_UP: 
                if(popup.displayed == true) {                    
                    if(this.activeItemIndex > 0) {
                        this.activeItemIndex --;                        
                    } else {
                        this.activeItemIndex = 0;
                    }
                }
                
                break;
                
                case KEY_ENTER:
                if(popup.displayed == true) {
                    this.resultsController.selectedIndexes = [this.activeItemIndex];
                    //this.selectSuggestedValue();
                    // select the currently active item in the results list
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

