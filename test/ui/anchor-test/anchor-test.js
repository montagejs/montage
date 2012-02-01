/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Anchor = require("montage/ui/anchor.reel").Anchor;

var AnchorTest = exports.AnchorTest = Montage.create(Montage, {

    link1: {
        value: null
    },

    link2: {
        value: null
    },

    link3: {
        value: null
    }
});
