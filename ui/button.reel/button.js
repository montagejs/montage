/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeButton = require("ui/native/button.reel/button").Button;

/**
 * Montage Button
 */
exports.Button = Montage.create(NativeButton, {

    hasTemplate: {value: true},

    didSetElement: {
        value: function() {
            NativeButton.didSetElement.call(this);
            this['class'] = (this['class'] || '') + ' montage-button';
        }
    }
});
