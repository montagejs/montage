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
    
    // private    
    
    popup: {
        value: null
    },

    resultsController: {
        value: null
    },
    
    // repetition
    resultsList: {
        value: null
    },
    
    // --------
    
    _getPopup: {
        value: function() {
            if(!this.popup) {
                      
            }                        
            return this.popup;
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
            if(!this.popup) {
                this.popup = Popup.create();
                this.popup.content = this.resultsList;
                this.popup.anchor = this.element;                
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
            this.resultsList = ResultsList.create();
            
            
            var popup = this._getPopup();
            this.resultsController.content = ['One', 'Two', 'Three', 'Four']; // temp
            //this.resultsList.contentController = this.resultsController;
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
                }
                break;
            }
        }
    },
    
    handleKeydown: {
        enumerable: false,
        value: function(event) {
            var code = event.keyCode;
        }
    }
    
});

