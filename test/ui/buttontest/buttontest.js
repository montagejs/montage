/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Button = require("montage/ui/button.reel").Button;

var ButtonTest = exports.ButtonTest = Montage.create(Montage, {
    deserializedFromTemplate: {
        value: function() {

            this.buttonElement = document.getElementById("testButton");
            this.buttonComponent = Montage.create(Button);
            this.buttonComponent.element = this.buttonElement;
            this.buttonComponent.needsDraw = true;

            return this;
        }
    },

    buttonElement: {
        value: null
    },

    buttonComponent: {
        value: null
    }
});
