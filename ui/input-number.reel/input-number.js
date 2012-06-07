/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module "montage/ui/input-number.reel"
    @requires montage/ui/component
    @requires montage/ui/text-input
*/

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeInputNumber = require("ui/native/input-number.reel").InputNumber;

/**
 * Wraps the a &lt;input type="date"> element with binding support for the element's standard attributes.
   @class module:"montage/ui/input-number.reel".InputNumber
   @extends module:montage/text-input.TextInput
 */
exports.InputNumber = Montage.create(NativeInputNumber, {

    hasTemplate: {
        value: true
    },

    didSetElement: {
        value: function() {
            NativeInputNumber.didSetElement.call(this);
            this['class'] = (this['class'] || '') + ' montage-inputNumber montage-inputText';
        }
    }

});