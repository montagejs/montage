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

exports.PicasaViewer = Montage.create(Montage, {

    _imagesPerPage: {
        value: 40
    },

    _startIndex: {
        value: 1
    },

    _entriesMemCache: {
        value: {}
    },

    _search: {
        value: ""
    },

    search: {
        get: function() {
            return this._search;
        },

        set: function(value) {
            this._search = value;
            // Reset the start index before doing a new search
            this._startIndex = 1;
            this.doSearch();
        }
    },

    searchResults: {
        value: []
    },

    isSearching: {
        value: false
    },

    message: {
        value: null
    },

    accessoryWindow: {
        value: null
    },

    deserializedFromTemplate: {
        value: function() {
            this.list.element.addEventListener("dblclick", this)
            this.doSearch();
        }
    },

    openWindowsListWindow: {
        value: function() {
            var mainWindow = window,
                windowParams = {
                    titlebar: false,
                    width: 240,
                    height: 380,
                    left:mainWindow.screenX + mainWindow.outerWidth + 10,
                    top: mainWindow.screenY
                };

            if (this.windowsListWindow && !this.windowsListWindow.closed) {
                this.windowsListWindow.focus();
            } else {
                this.windowsListWindow = document.application.openWindow("windows-list.reel", "Accessory", windowParams);
                this.windowsListWindow.addEventListener("load", function(event) {
                        childWindow.title = "Windows";
                    }
                );

            }
        }
    },

    handleDblclick: {
        value: function(event) {
            var target = event.target,
                selectedImage = this.list.contentController.selectedObjects[0],
                windowParams = {scrollbar: false, titlebar: false},
                childWindow;

            if (target.tagName == "IMG" && selectedImage) {
                // Let's open the image in a new window, or select the image's standalone window

                if (selectedImage.window && !selectedImage.window.closed) {
                    selectedImage.window.focus();
                } else {
                    windowParams.height = selectedImage.image.height;
                    windowParams.width = selectedImage.image.width;

                    childWindow = document.application.openWindow("image-viewer.reel", "ImageViewer", windowParams);
                    childWindow.addEventListener("load", function(event) {
                            childWindow.component.item = selectedImage;
                            selectedImage.window = childWindow;
                        }
                    );
                }
            }
        }
    },

    handleAction: {
        value: function(event) {
            var action = event.target.identifier;

            if (action == "next") {
                this._startIndex += this._imagesPerPage;
            } else if (action == "previous") {
                this._startIndex -= this._imagesPerPage;
                if (this._startIndex < 1) {
                    this._startIndex += 1
                }
            }
            this.doSearch();
        }
    },

    _searchRequest: {
        value: null
    },

    doSearch: {
        value: function() {
            var req = this._searchRequest,
                url = "http://picasaweb.google.com/data/feed/base/all?visibility=public&alt=json&kind=photo&imgmax=720u&thumbsize=160c";

            url += "&fields=entry(media:group/media:content,media:group/media:thumbnail,media:group/media:title)";
//            url += "&prettyprint=true";
            url += "&q=" + this._search;
            url += "&start-index=" + this._startIndex + "&max-results=" + this._imagesPerPage;
            if (req) {
                req.abort();
            }

            this.isSearching = true;

            this._searchRequest = req = new XMLHttpRequest();
            req.identifier = "searchRequest";
            req.open("GET", url);
            req.addEventListener("load", this, false);
            req.addEventListener("error", this, false);
            req.send();
        }
    },

    handleSearchRequestLoad: {
        value: function(event) {
            var response = JSON.parse(event.target.responseText),
                results = response.feed.entry,
                entry,
                cachedEntry,
                index,
                updatedSearchResult = [],
                content,
                thumbnail;

            // Cache the rating and title of existing images
            for (index in this.searchResults) {
                entry = this.searchResults[index];
                cachedEntry = this._entriesMemCache[entry.image.src];
                if (entry.rating || (cachedEntry && cachedEntry.rating !== undefined) ||
                        (entry.title != entry.originalTitle || (cachedEntry && cachedEntry.title !== entry.title))) {

                    if (!cachedEntry) {
                        cachedEntry = this._entriesMemCache[entry.image.src] = {};
                    }
                    cachedEntry.rating = entry.rating;
                    cachedEntry.title = entry.title;
                }
            }

            // update the results
            for (index in results) {
                entry = results[index]["media$group"];
                content = entry["media$content"][0];
                thumbnail = entry["media$thumbnail"][0];
                cachedEntry = this._entriesMemCache[content.url] || {};

                updatedSearchResult.push({
                    image: {src:content.url, height:content.height, width:content.width},
                    thumb: {src:thumbnail.url, height:thumbnail.height, width:thumbnail.width},
                    originalTitle: entry["media$title"]["$t"],
                    title: cachedEntry.title || entry["media$title"]["$t"],
                    rating: cachedEntry.rating || 0
                });
            }
            this.searchResults = updatedSearchResult;
            if (updatedSearchResult.length > 0) {
                this.message = null;
            } else {
                this.message = "no images"
            }

            this.isSearching = false;
        }
    },

    handleSearchRequestError: {
        value: function(event) {
            this.message = event.target.statusText || event.target.responseText || "Connection Error";
            this.isSearching = false;
        }
    }
});
