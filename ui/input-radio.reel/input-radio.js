/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    @module "montage/ui/input-radio.reel"
*/
/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeInputRadio = require("ui/native/input-radio.reel").InputRadio;

/**
 * Input Radio
 * @class module:"montage/ui/input-radio.reel".InputRadio
 * @extends module:"montage/ui/native/input-radio.reel".InputRadio
 */
exports.InputRadio = Montage.create(NativeInputRadio, /** @lends module:"montage/ui/input-radio.reel".InputRadio# */ {

    hasTemplate: {value: true},

    didSetElement: {
        value: function() {
            NativeInputRadio.didSetElement.call(this);
            this['class'] = (this['class'] || '') + ' montage-inputRadio';
        }
    }

});