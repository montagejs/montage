/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
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
