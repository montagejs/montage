/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeInputText = require("ui/native/input-text.reel").InputText;

/**
 * Input Text
 */
exports.InputText = Montage.create(NativeInputText, {

    hasTemplate: {value: true},

    didSetElement: {
        value: function() {
            NativeInputText.didSetElement.call(this);
            this['class'] = (this['class'] || '') + ' montage-input-text';
        }
    }
});