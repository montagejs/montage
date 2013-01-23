/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

/**
    @module "montage/ui/autocomplete/autocomplete.reel"
*/

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    TextInput = require("ui/text-input").TextInput,
    logger = require("core/logger").logger("autocomplete"),
    ResultsList = require("ui/autocomplete/results-list.reel/results-list").ResultsList,
    ArrayController = require("ui/controller/array-controller").ArrayController,
    Popup = require("ui/popup/popup.reel").Popup,
    PressComposer = require("ui/composer/press-composer").PressComposer;

var KEY_UP = 38,
    KEY_DOWN = 40,
    KEY_RIGHT = 39,
    KEY_ENTER = 13,
    KEY_ESC = 27;

var getElementPosition = function(obj) {
    var curleft = 0, curtop = 0, curHt = 0, curWd = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
            curHt += obj.offsetHeight;
            curWd += obj.offsetWidth;
        } while ((obj = obj.offsetParent));
    }
    return {
        top: curtop,
        left: curleft,
        height: curHt,
        width: curWd
    };
};

/**
    The Autocomplete component
    @class module:"montage/ui/autocomplete/autocomplete.reel".Autocomplete
    @extends module:montage/ui/text-input.TextInput
*/
var Autocomplete = exports.Autocomplete = Montage.create(TextInput, /** @lends module:"montage/ui/autocomplete/autocomplete.reel".Autocomplete# */ {

    didCreate: {
        value: function() {
            this.delay = 500;
            this.minLength = 2;
        }
    },

    hasTemplate: {value: true},

    willPrepareForDraw: {
        value: function() {
            TextInput.willPrepareForDraw.call(this);
            this.element.classList.add("montage-InputText");
        }
    },

/**
    The AutoComplete instance's delegate object.
    @type {Object}
*/
    delegate: {
        value: null
    },

    /**
    * If the delegate returns Objects, this property can be used to derive the
    * display string for an object. If this property is not provided, the results
    * provided by the delegate are assumed to be String.
    @type {String}
    */
    textPropertyPath: {
        value: null
    },

/**
    The string separator to use between tokens in the AutoComplete.
    @type {String}
    @default {Boolean} ","
*/
    separator: {
        value: ',',
        distinct: true
    },

    _delay: {value: null},

/**
    The delay in milliseconds between when the user modifies the input field and when the query to retrieve suggestions is executed.
    @type {Number}
    @defaultvalue 500
*/
    delay: {
        get: function(){
            return this._delay;
        },
        set: function(value) {
            if(value !== this._delay) {
                if(String.isString(value)) {
                    value = parseInt(value, 10);
                }
                this._delay = value;
            }
        }
    },

    /**
    * The number of characters the user must type before the query for suggeseted tokens executes.
    * @type {Number}
    */
    minLength: {
        value: null
    },

    _tokens: {value: null},
/**
    Gets and sets the tokens being displayed by the AutoComplete component.
    @type {Array}
*/
    tokens: {
        get: function() {
            return this._tokens;
        },
        set: function(value) {
            this._tokens = value;
            this._valueSyncedWithInputField = false;
            this.needsDraw = true;
        },
        modify: function(v) {
            this._tokens = v;
        }
    },

    // overridden here to get the substring/searchString
    value: {
        get: function() {
            return this._value;
            //var arr = this.tokens;
            //return (arr ? arr.join(',') : this._value);
        },
        set: function(newValue, fromInput) {
            this._value = newValue ? newValue.trim() : '';

            // get the entered text after the separator
            var value = this._value;

            if(value) {
                var arr = value.split(this.separator).map(function(item) {
                    return item.trim();
                });
                this.activeTokenIndex = this._findActiveTokenIndex(this.tokens, arr);
                this._tokens = value.split(this.separator).map(function(item) {
                    return item.trim();
                });
            } else {
                this.activeTokenIndex = 0;
                this._tokens = [];
            }

            if(fromInput) {
                this._valueSyncedWithInputField = true;
                this.showPopup = false;
                if(this._tokens.length && this._tokens.length > 0) {
                    var searchTerm = this._tokens[this.activeTokenIndex];
                    searchTerm = searchTerm ? searchTerm.trim() : '';
                    if(searchTerm.length >= this.minLength) {
                        var self = this;
                        clearTimeout(this.delayTimer);
                        this.delayTimer = setTimeout(function() {
                            self.delayTimer = null;
                            if (logger.isDebug) {
                                logger.debug('SEARCH for ', searchTerm);
                            }
                            self.performSearch(searchTerm);
                        }, this.delay);
                    }
                }

            } else {
                this.showPopup = false;
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
    _loadingStatus: {value: false, enumerable: false},
    loadingStatus: {
        enumerable: false,
        get: function() {
            return this._loadingStatus;
        },
        set: function(value) {
            this._loadingStatus = value;
            if(this._loadingStatus === 'loading') {
                this.showPopup = false;
            }
            this.needsDraw = true;
        }
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
        enumerable: false,
        get: function() {
            return this._suggestedValue;
        },
        set: function(aValue) {
            this._suggestedValue = aValue;
            if(aValue) {

                var arr = this.tokens || [];
                var token;

                if(String.isString(aValue)) {
                    token = aValue;
                } else {
                    if(this.textPropertyPath) {
                        token = aValue[this.textPropertyPath];
                    } else {
                        token = '';
                    }
                }

                arr[this.activeTokenIndex] = token;
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
            if(value != this._showPopup) {
                this._showPopup = value;
                this.needsDraw = true;
            }
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
            if (logger.isDebug) {
                logger.debug('got suggestions: ', value);
            }

            this.loadingStatus = 'complete';
            this._suggestions = value;
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
                this.resultsController.selectedIndexes = [];
                // index on the popup
                this.activeItemIndex = 0;
                this.loadingStatus = 'loading';
                var delegateFn = this.callDelegateMethod('ShouldGetSuggestions', this, searchTerm);

            }
        }
    },


    _addEventListeners: {
        enumerable: false,
        value: function() {
            this.element.addEventListener("keyup", this);
            this.element.addEventListener("input", this);
        }
    },

    _removeEventListeners: {
        enumerable: false,
        value: function() {
            this.element.removeEventListener("keyup", this);
            this.element.removeEventListener("input", this);
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
                popup.delegate = this;
                // dont let the popup take away the focus
                // we need the focus on the textfield
                popup.focusOnShow = false;
                this.popup = popup;
            }
            return this.popup;

        }
    },

    // Delegate method to position the suggest popup
    willPositionPopup: {
        value: function(popup, defaultPosition) {
            var anchor = popup.anchorElement, anchorPosition = getElementPosition(anchor);
            return {
                left: anchorPosition.left,
                top: anchorPosition.top + 30
            };

        }
    },

    prepareForDraw: {
        value: function() {
            this._addEventListeners();
            this.element.classList.add('montage-Autocomplete');

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
            Object.defineBinding(this.resultsList, "textPropertyPath", {
                boundObject: this,
                boundObjectPropertyPath: "textPropertyPath",
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

            if (!this._valueSyncedWithInputField) {
                if(this.tokens) {
                    this.value = this.tokens.join(this.separator);
                }
                if(this.value && this.value.charAt(this.value.length-1) != this.separator) {
                    this.value += this.separator;
                }
                this.element.value = this.value;
                this._valueSyncedWithInputField = true;
            }
            var showPopup = this.showPopup;
            if(this.value === '') {
                showPopup = false;
            }

            if(showPopup) {
                this.popup.show();
                // reset active index
                this.activeItemIndex = 0;
            } else {
                if(this.popup && this.popup.displayed) {
                    this.popup.hide();
                }
            }

            var isLoading = (this.loadingStatus === 'loading');
            this.element.classList[isLoading ? 'add' : 'remove']('montage-Autocomplete--loading');


        }
    },


    handleKeyup: {
        enumerable: false,
        value: function(e) {
            var code = e.keyCode, popup = this._getPopup();

            switch(code) {
                case KEY_DOWN:
                if(!popup.displayed) {
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
                if(popup.displayed === true) {
                    if(this.activeItemIndex > 0) {
                        this.activeItemIndex --;
                    } else {
                        this.activeItemIndex = 0;
                    }
                }

                break;

                case KEY_ENTER:
                if(popup.displayed === true) {
                    this.resultsController.selectedIndexes = [this.activeItemIndex];
                    e.preventDefault();
                    // select the currently active item in the results list
                } else {
                    this.suggestedValue = this.tokens[this.tokens.length-1];
                }

                break;

            }
            this.element.focus();
        }
    }

});

