/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    @module "montage/ui/input-text.reel"

/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeInputText = require("ui/native/input-text.reel").InputText;

/**
 * Input Text
 * @class module:"montage/ui/input-text.reel".InputText
 * @extends module:montage/ui/native/input-text.reel.InputText
 */
exports.InputText = Montage.create(NativeInputText, /** @lends module:"montage/ui/input-text.reel".InputText# */ {

    hasTemplate: {value: true},

    didSetElement: {
        value: function() {
            NativeInputText.didSetElement.call(this);
            this['class'] = (this['class'] || '') + ' montage-InputText';
        }
    }
});
