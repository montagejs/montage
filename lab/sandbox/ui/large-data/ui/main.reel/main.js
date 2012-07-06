/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    ArrayController = require("montage/ui/controller/array-controller").ArrayController,
    Converter= require("montage/core/converter/converter").Converter;

exports.Main = Montage.create(Component, {

    collectionController: {
        value: null
    },

    templateDidLoad: {
        value: function() {
            this.collectionController = ArrayController.create();

            var count = 5000;
            var myArray = [];
            for (var i = 0; i < count; i++) {
                myArray[i] = {label: i};
            }

            this.collectionController.content = myArray;
        }
    },

    indexMap: {
        dependencies: ["itemsPerPageCount", "startIndex"],
        get: function() {
            var indexMap = [];

            for (var i = 0; i < this.itemsPerPageCount; i++) {
                indexMap[i] = this.startIndex + i;
            }

            // TODO only if the currently selectedObject is no longer visible, deselect it
            // TODO fix the repainting of the selected classname on the repetition
            if (this.collectionController) {
                this.collectionController.selectedObjects = null;
            }

            return indexMap;
        }
    },

    handleNextPageButtonAction: {
        value: function() {
            var nextIndex = this.startIndex + this.itemsPerPageCount;

            if (nextIndex < this.collectionController.organizedObjects.length) {
                this.startIndex = nextIndex;
            }
        }
    },

    handlePreviousPageButtonAction: {
        value: function() {
            var previousIndex = this.startIndex - this.itemsPerPageCount;

            this.startIndex = previousIndex < 0 ? 0 : previousIndex;
        }
    },

    itemsPerPageCount: {
        value: 5
    },

    startIndex: {
        value: 0
    }

});

exports.FloorConverter = Montage.create(Converter, {

    convert: {
        value: function(value) {
            return Math.floor(value);
        }
    },

    revert: {
        value: function(value) {
            return Math.floor(value);
        }
    }

});
