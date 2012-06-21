/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    @module "montage/ui/textarea.reel"
*/
/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeTextarea = require("ui/native/textarea.reel").Textarea;

/**
 * Textarea
 * @class module:"montage/ui/textarea.reel".Textarea
 * @lends module:"ui/native/textarea.reel".Textarea
 */
exports.Textarea = Montage.create(NativeTextarea, /** @lends module:"montage/ui/textarea.reel".Textarea */ {

    hasTemplate: {value: true},

    didSetElement: {
        value: function() {
            NativeTextarea.didSetElement.call(this);
            this['class'] = (this['class'] || '') + ' montage-textarea';
        }
    }
});