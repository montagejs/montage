/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.SearchPanel = Montage.create(Component, {

    photoListController: {
        enumerable: false,
        value: null
    },

    queryParameter: {
        enumerable: false,
        value: null
    },

    resultCount: {
        enumerable: false,
        value: 20
    },

    prepareForDraw: {
        enumerable: false,
        value: function() {
            this.searchForm.identifier = "searchForm";
            this.searchForm.addEventListener("submit", this, false);
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
        set: Component.setPropertyAndNeedsDraw("_isSearching")
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
            var response = JSON.parse(evt.target.responseText);
            this.searchResults = response.feed.entry;
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
