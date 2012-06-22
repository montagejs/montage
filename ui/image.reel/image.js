/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeImage = require("ui/native/image.reel").Image;

/**
 * Input Text
 */
exports.Image = Montage.create(NativeImage, {

    didSetElement: {
        value: function() {
            // Call super method
            NativeImage.didSetElement.call(this);
            this['class'] = (this['class'] || '') + ' montage-image';
        }
    }

});
