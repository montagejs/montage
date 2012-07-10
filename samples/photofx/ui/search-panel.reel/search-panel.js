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
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.SearchPanel = Montage.create(Component, {

    photoListController: {
        value: null
    },

    queryParameter: {
        value: null
    },

    resultCount: {
        value: 20
    },
    searchForm: {
        value: null
    },

    searchResultsList: {
        value: null
    },

    prepareForDraw: {
        value: function() {
            this.searchForm.identifier = "searchForm";
            this.searchForm.addEventListener("submit", this, false);
        }
    },

    _isSearching: {
        value: false
    },

    isSearching: {
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
