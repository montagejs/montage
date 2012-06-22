/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;

exports.MixedList = Montage.create(Montage, {

    handleAddButtonAction: {
        value: function(event) {
            var length = this.choices.length;
            this.objectList.push(this.choices[Math.floor ( Math.random() * length )]);
        }
    },

    choices: {
        value: [
            {
                "type": "boolean",
                "value": false
            },
            {
                "type": "boolean",
                "value": true
            },
            {
                "type": "range",
                "value": 0
            },
            {
                "type": "range",
                "value": 20
            },
            {
                "type": "range",
                "value": 75
            },
            {
                "type": "range",
                "value": 100
            },
            {
                "type": "check",
                "value": false
            },
            {
                "type": "check",
                "value": true
            }
        ]
    },

    objectList: {
        value: null
    },

    templateDidLoad: {
        value: function() {
            this.objectList = [{"type": "boolean","value": true}];
        }
    }
});

exports.SubstitutionDelegate = Montage.create(Montage, {

    slotElementForComponent: {
        value: function(contentToAppend, nodeToAppend) {
            var element = document.createElement("div");
            if (contentToAppend.switchValue === "boolean") {
                element = document.createElement("input");
                element.setAttribute("type", "radio");
            } else if (contentToAppend.switchValue === "check") {
                element = document.createElement("input");
                element.setAttribute("type", "checkbox");
            } else if (contentToAppend.switchValue === "range") {
                element = document.createElement("input");
                element.setAttribute("type", "range");
            }
            return element;
        }
    }

});
