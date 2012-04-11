/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**

    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;
/**
 @class module:"montage/ui/google/map.reel".Map
 @extends module:montage/ui/component.Component
 */
var PicasaCarousel = exports.PicasaCarousel = Montage.create(Component, /** @lends module:"montage/ui/toggle-switch.reel".ToggleSwitch# */ {
	    photoListController: {
	        enumerable: false,
	        value: null
	    },

        flow: {
            value: null
        },

        initialPosition: {
            value: 2300
        },



        _queryParameter: {
            enumerable: false,
            value: null
        },

	    queryParameter: {
            get: function() {
                return this._queryParameter;
            },
            set: function(value) {
                this._queryParameter = value;
                this.performSearch();
            }
	    },

	    resultCount: {
	        enumerable: false,
	        value: 40
	    },

	    prepareForDraw: {
	        enumerable: false,
	        value: function() {
	            // this.searchForm.identifier = "searchForm";
	            // this.searchForm.addEventListener("submit", this, false);
	        }
	    },

	    _isSearching: {
	        value: false,
	        enumerable: false
	    },

	    isSearching: {
	        enumerable: false,
	        get: function() {
	            return this._isSearching;
	        },
	        set: function(value) {
	            if (value === this._isSearching) {
	                return;
	            }

	            this._isSearching = value;
	            this.needsDraw = true;
	        }
	    },

	    handleSearchFormSubmit: {
	        value: function(evt) {
	            evt.preventDefault();
	            this.performSearch();
	        }
	    },

	    performSearch: {
	        value: function() {
	            if (this.isSearching) {
	                console.log("already searching!")
	                return;
	            }

	            this.isSearching = true;
	            this.searchResults = null;

	            var base = "http://picasaweb.google.com/data/feed/base/all?visibility=public&alt=json&max-results=" + this.resultCount + "&kind=photo&prettyprint=true&imgmax=720u&q="
	//            var base = "http://picasaweb.google.com/data/feed/base/featured?visibility=public&alt=json&max-results=" + this.resultCount + "&kind=photo&prettyprint=true"
	            var url = base + this.queryParameter;

	            var req = new XMLHttpRequest();
	            req.identifier = "searchRequest";
	            req.open("GET", url);
	            req.addEventListener("load", this, false);
	            req.addEventListener("error", this, false);
	            req.send();

	        }
	    },

	    handleSearchRequestLoad: {
	        value: function(evt) {
	            var response = JSON.parse(evt.target.responseText),
                    previousOrigin = this.flow.origin;
	            this.searchResults = response.feed.entry;
                if (this.flow.length === 0) {
                    this.flow.length = this.initialPosition;
                }
                if (previousOrigin === 0) {
                    this.flow.origin = this.initialPosition;
                } else {
                    this.flow.origin = previousOrigin;
                }
	            this.isSearching = false;
	        }
	    },

	    handleSearchRequestError: {
	        value: function(evt) {
	            console.error("handleSearchRequestError", evt);
	            this.isSearching = false;
	        }
	    },

	    searchResults: {
	        enumerable: false,
	        value: null
	    },

	    draw: {
	        value: function() {

	            if (this.isSearching) {
	                this.element.classList.add("searching");
	            } else {
	                this.element.classList.remove("searching");
	            }

	        }
	    }

});
