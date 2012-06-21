/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module "montage/ui/anchor.reel"
*/

/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeAnchor = require("ui/native/anchor.reel").Anchor;

/**
 * Montage Anchor
 * @class module:"montage/ui/anchor.reel".Anchor
 * @extends module:"montage/ui/native/anchor.reel".Anchor
 */
exports.Anchor = Montage.create(NativeAnchor, /** @lends module:"montage/ui/anchor.reel".Anchor# */{

    hasTemplate: {value: false},

    didSetElement: {
        value: function() {
            NativeAnchor.didSetElement.call(this);
            this['class'] = (this['class'] || '') + ' montage-anchor';
        }
    }
});
