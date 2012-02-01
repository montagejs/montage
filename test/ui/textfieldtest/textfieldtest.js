/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Textfield = require("montage/ui/bluemoon/textfield.reel").Textfield;

var TextfieldTest = exports.TextfieldTest = Montage.create(Montage, {

    txt1: {
        value: null
    },

    txt2: {
        value: null
    },

    date1: {
        value: null
    }
});
