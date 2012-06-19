/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    ArrayController = require("montage/ui/controller/array-controller").ArrayController;

exports.Main = Montage.create(Component, {

    collectionController: {
        value: null
    },

    flowComponent: {
        value: null
    },

    linearFlowComponent: {
        value: null
    },

    templateDidLoad: {
        value: function() {
            this.collectionController = ArrayController.create();
            this.collectionController.content = ["A", "B", "C", "D", "E"];
        }
    },

    handleClearSelectionButtonAction: {
        value: function() {
            this.collectionController.selectedIndexes = null;
        }
    },

    handleSelectFirstButtonAction: {
        value: function() {
            this.collectionController.selectedIndexes = [0];
        }
    },

    handleSelectLastButtonAction: {
        value: function() {
            this.collectionController.selectedIndexes = [this.collectionController.organizedObjects.length - 1];
        }
    },

    handleShuffleFlowButtonAction: {
        value: function() {
            this.flowComponent.shuffle();
            this.linearFlowComponent.shuffle();
        }
    },

    handlePushButtonAction: {
        value: function() {
            var nextChar = this.collectionController.content.length;
            this.collectionController.content.push(this.alphaCode(nextChar));
        }
    },

    alphaCode: {
        value: function(value) {
            var alphaCode = "";

            for (; value >= 0; value = (value / 26) - 1) {
                 alphaCode = String.fromCharCode(value % 26 + 65) + alphaCode;
            }

            return alphaCode;
        }
    },

    handlePopButtonAction: {
        value: function() {
            this.collectionController.content.pop();
        }
    }

});
