/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Textfield = require("montage/ui/bluemoon/textfield.reel").Textfield;

var TextfieldTest = exports.TextfieldTest = Montage.create(Montage, {
    deserializedFromTemplate: {
        enumerable: false,
        value: function() {

            var element1 = document.getElementById("textfield1"),
            element2 = document.getElementById("textfield2"),
            element3 = document.getElementById("textfield3");

            this.textfield1 = Textfield.create();
            this.textfield2 = Textfield.create();
            this.textfield3 = Textfield.create();

            this.textfield1.element = element1;
            this.textfield2.element = element2;
            this.textfield3.element = element3;

            this.textfield1.needsDraw = true;
            this.textfield2.needsDraw = true;
            this.textfield3.needsDraw = true;

            return this;
        }
    },

    textfield1: {
        value: null
    },

    textfield2: {
        value: null
    },

    textfield3: {
        value: null
    }
});
