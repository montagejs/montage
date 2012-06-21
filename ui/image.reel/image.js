/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module "montage/ui/image.reel"
*/

/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeImage = require("ui/native/image.reel").Image;

/**
 * Input Text
 * @class module:"montage/ui/image.reel".Image
 * @extends module:"montage/ui/native/image.reel".Image
 */
exports.Image = Montage.create(NativeImage, /** @lends module:"montage/ui/native/image.reel".Image */ {

    didSetElement: {
        value: function() {
            // Call super method
            NativeImage.didSetElement.call(this);
            this['class'] = (this['class'] || '') + ' montage-image';
        }
    }

});