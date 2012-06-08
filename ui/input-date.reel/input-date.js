/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module "montage/ui/input-date.reel"
    @requires montage/ui/component
    @requires montage/ui/text-input
*/

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeInputDate = require("ui/native/input-date.reel").InputDate;

/**
 * Wraps the a &lt;input type="date"> element with binding support for the element's standard attributes.
   @class module:"montage/ui/input-date.reel".InputDate
   @extends module:montage/text-input.TextInput
 */
exports.InputDate = Montage.create(NativeInputDate, {

    hasTemplate: {
        value: true
    },

    didSetElement: {
        value: function() {
            NativeInputDate.didSetElement.call(this);
            this['class'] = (this['class'] || '') + ' ' + 'montage-inputDate montage-inputText';
        }
    }

});
