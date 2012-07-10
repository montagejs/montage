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
