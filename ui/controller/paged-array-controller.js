/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
	@module montage/ui/controller/paged-array-controller
    @requires montage/core/core
    @requires ui/controller/array-controller
    @requires core/event/mutable-event
*/
var Montage = require("montage").Montage,
    ArrayController = require("ui/controller/array-controller").ArrayController,
    MutableEvent = require("core/event/mutable-event").MutableEvent;
/**
    @class module:montage/ui/controller/paged-array-controller.PagedArrayController
    @extends module:montage/ui/controller/array-controller.ArrayController
*/
exports.PagedArrayController = Montage.create(ArrayController,/** @lends module:montage/ui/controller/paged-array-controller.PagedArrayController# */ {
/**
  Description TODO
  @private
*/
    _pageSize: {
        value: 10
    },
        //changing this should recalculate pageIndex to contain first item of previous current page
        // via gotoOffset ?
/**
        Description TODO
        @type {Function}
        @default {Number} 10
    */
    pageSize: {
        get: function() {
            return this._pageSize;
        },
        set: function(value) {
            if (value !== this._pageSize) {
                this._calculate(value, this._pageIndex, this._padding);
            }
        }
    },

/**
  Description TODO
  @private
*/
    _padding: {
        value: 0
    },
    // changing this should change the organized object to have the new padding
/**
        Description TODO
        @type {Function}
        @default {Number} 0
    */
    padding: {
        get: function() {
            return this._padding;
        },
        set: function(value) {
            if (value !== this._padding) {
                this._calculate(this._pageSize, this._pageIndex, value);
            }
        }
    },
/**
  Description TODO
  @private
*/
    _pageIndex: {
        value: 0,
        enumerable: false
    },
        // changing this should change the start and endIndex
/**
        Description TODO
        @type {Function}
        @default {Number} 0
    */
    pageIndex: {
        get: function() {
            return this._pageIndex;
        },
        set: function(pageIndex) {
            if (pageIndex !== this._pageIndex) {
                pageIndex = pageIndex >= this.pageCount ? this.pageCount - 1 : pageIndex < 0 ? 0 : pageIndex;
                this._calculate(this._pageSize, pageIndex, this._padding);
            }
        }
    },

 /**
  Description TODO
  @private
*/
    _pageCount: {
        value: null,
        enumerable: false
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    pageCount: {
        get: function() {
            return this._pageCount;
        }
    },

/**
        Description TODO
        @type {Function}
        @default {Array} array
    */
    pageNumber: {
        dependencies: ["pageIndex"],
        get: function() {
            return this._pageIndex + 1;
        }
    },

 /**
  Description TODO
  @private
*/
    _calculate: {
        value: function(pageSize, pageIndex, padding) {
            var contentLength = this.content.length,
                pageCount = this._pageCount,
                startIndex, endIndex,
                pageSizeChangeEvent,
                pageIndexChangeEvent,
                paddingChangeEvent,
                pageCountChangeEvent,
                startIndexChangeEvent,
                endIndexChangeEvent;

            if (pageSize !== this._pageSize) {
                pageSizeChangeEvent = MutableEvent.changeEventForKeyAndValue("pageSize", this._pageSize);
                this._pageSize = pageSize;
            }
            if (pageIndex !== this._pageIndex) {
                pageIndexChangeEvent = MutableEvent.changeEventForKeyAndValue("pageIndex", this._pageIndex);
                this._pageIndex = pageIndex;
            }
            if (padding !== this._padding) {
                paddingChangeEvent = MutableEvent.changeEventForKeyAndValue("padding", this._padding);
                this._padding = padding;
            }

            pageCountChangeEvent = MutableEvent.changeEventForKeyAndValue("pageCount", pageCount);
            this._pageCount = pageCount = Math.ceil(contentLength / pageSize);

            startIndexChangeEvent = MutableEvent.changeEventForKeyAndValue("startIndex", this._startIndex);
            startIndex = pageIndex * pageSize - padding;
            this._startIndex = startIndex = startIndex < 0 ? 0 : startIndex;

            endIndexChangeEvent = MutableEvent.changeEventForKeyAndValue("endIndex", this._endIndex);
            endIndex = pageIndex * pageSize + pageSize + padding;
            this._endIndex = endIndex = endIndex > contentLength ? contentLength : endIndex;

            if (pageCountChangeEvent.minus !== pageCount) {
                this.dispatchEvent(pageCountChangeEvent.withPlusValue(pageCount));
            }
            if (startIndexChangeEvent.minus !== startIndex) {
                this.dispatchEvent(startIndexChangeEvent.withPlusValue(startIndex));
            }
            if (endIndexChangeEvent.minus !== endIndex) {
                this.dispatchEvent(endIndexChangeEvent.withPlusValue(endIndex));
            }
            if (pageSizeChangeEvent) {
                this.dispatchEvent(pageSizeChangeEvent.withPlusValue(pageSize));
            }
            if (pageIndexChangeEvent) {
                this.dispatchEvent(pageIndexChangeEvent.withPlusValue(pageIndex));
            }
            if (paddingChangeEvent) {
                this.dispatchEvent(paddingChangeEvent.withPlusValue(padding));
            }
        }
    },
/**
    Description TODO
    @function
    */
    gotoFirstPage: {
        value: function() {
            this.gotoPage(0);
        }
    },
/**
    Description TODO
    @function
    */
    gotoLastPage: {
        value: function() {
            this.gotoPage(this.pageCount - 1);
        }
    },
/**
    Description TODO
    @function
    */
    gotoNextPage: {
        value: function() {
            this.gotoPage(this.pageIndex + 1);
        }
    },
/**
    Description TODO
    @function
    */
    gotoPreviousPage: {
        value: function() {
            this.gotoPage(this.pageIndex - 1);
        }
    },
/**
    Sets the currentPage so that the desired item is contained in that page.
    @function
    @param {Array} pageIndex The index of the item to be shown.
    */
    gotoPage: {
        value: function(pageIndex) {
            this.pageIndex = pageIndex;
        }
    },
/**
    Sets the currentPage so that the desired item is contained in that page.
    @function
    @param {Math} offset The index of the item to be shown.
    */
    gotoContentIndex: {
        value: function(offset) {
            this.gotoPage(Math.floor(offset / this.pageSize));
        }
    },

 /**
        Description TODO
        @type {Function}
        @default null
    */
    content: {
        get: function() {
            return Object.getPropertyDescriptor(ArrayController, "content").get.call(this);
        },
        set: function(value) {
            if (value !== this.content) {
                Object.getPropertyDescriptor(ArrayController, "content").set.call(this, value);
                this._calculate(this._pageSize, this._pageIndex, this._padding);
            }
        }
    }


});
