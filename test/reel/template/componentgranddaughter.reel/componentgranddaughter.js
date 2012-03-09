/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
exports = typeof exports !== "undefined" ? exports : {};

var Montage = require("montage").Montage;
var ComponentDaughter = require("reel/template/componentdaughter.reel").ComponentDaughter;


var ComponentGranddaughter = exports.ComponentGranddaughter = Montage.create(ComponentDaughter, {
    templateDidLoadCallCount: {
        value: 0
    },

    templateDidLoad: {
        value: function() {
            this.templateDidLoadCallCount++;
        }
    }
});
