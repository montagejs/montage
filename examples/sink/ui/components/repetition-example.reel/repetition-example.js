/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.RepetitionExample = Montage.create(Component, {

    data: {
        value: null
    },

    answers: {
        value: null
    },

    jsonSelectedItems: {
        dependencies: ["selectedItems"],
        get: function() {
            return JSON.stringify(this.selectedItems||[]);
        }
    },

    selectedItems: {
        value: null
    },

    selectedAnswer: {
        value: null
    },

     prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
    },

    logger: {
        value: null
    }

});
