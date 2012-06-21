/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports */
/**
    @module "montage/ui/button.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires montage/ui/native/button.reel/button
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeButton = require("ui/native/button.reel/button").Button;

/**
 * Montage Button
 @class module:"montage/ui/button.reel".Button
 @extends module:"montage/ui/native/button.reel/button".Button
*/
exports.Button = Montage.create(NativeButton, /** @lends module:"montage/ui/button.reel".Button# */ {

    hasTemplate: {value: true},

    didSetElement: {
        value: function() {
            NativeButton.didSetElement.call(this);
            this['class'] = (this['class'] || '') + ' montage-button';
        }
    }
});
