/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.Main = Montage.create(Component, {

    hasTemplate: {
        value: false
    },

    top: {
        value: 0
    },

    left: {
        value: 0
    },

    color: {
        value: 0
    },

    content: {
        value: 0
    },

    count: {
        value: 0
    },

    draw: {
        value: function(timestamp) {
            this.needsDraw = true;
            this.top = Math.sin(this.count / 10) * 10;
            this.left = Math.cos(this.count / 10) * 10;
            this.color = (this.count) % 255;
            this.content = this.count % 100;
            this.count = this.count + 1;
        }
    }


});
