/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Composer = require("montage/ui/composer/composer").Composer;

exports.AnimateTestComposer = Montage.create(Composer, /** @lends module:montage/ui/composer/swipe-composer.SwipeComposer# */ {

/**
    Description TODO
    @function
    @param {Element}
    */
    load: {
        value: function() {
            this.needsFrame = true;
        }
    },

/**
    Description TODO
    @function
    */
    unload: {
        value: function() {
            this.needsFrame = false;
        }
    },

    frame: {
        value: function(timestamp) {
            this.needsFrame = true;
            this.top = Math.sin(this.count / 10) * 10;
            this.left = Math.cos(this.count / 10) * 10;
            this.color = (this.count) % 255;
            this.content = this.count % 100;
            this.count = this.count + 1;
        }
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
    }

});
